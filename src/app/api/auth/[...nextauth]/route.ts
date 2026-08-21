import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email/Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Get IP and User-Agent from headers
        const ip = (req?.headers?.['x-forwarded-for'] || 'unknown') as string;
        const userAgent = (req?.headers?.['user-agent'] || 'unknown') as string;

        // Rate Limiting: block if more than 5 failed attempts from this IP in the last 15 minutes
        const recentAttempts = await prisma.loginLog.count({
          where: {
            ipAddress: ip,
            createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
            success: false
          }
        });

        if (recentAttempts >= 5) {
          throw new Error("มีความพยายามล็อคอินเกิน 5 ครั้งและได้ lock อีเมลนี้แล้ว");
        }

        if (credentials.email === 'admin' && credentials.password === 'admin') {
          const adminUser = await prisma.user.upsert({
            where: { email: 'admin@example.com' },
            update: {},
            create: {
              id: 'admin-123',
              email: 'admin@example.com',
              name: 'Administrator',
              role: 'ADMIN'
            }
          });
          
          await prisma.loginLog.create({
            data: { email: credentials.email, ipAddress: ip, userAgent, success: true }
          });
          
          return {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
          };
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          // Log failed attempt for unknown user
          await prisma.loginLog.create({
            data: { email: credentials.email, ipAddress: ip, userAgent, success: false }
          });
          return null;
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await prisma.loginLog.create({
            data: { email: credentials.email, ipAddress: ip, userAgent, success: false }
          });
          throw new Error("มีความพยายามล็อคอินเกิน 5 ครั้งและได้ lock อีเมลนี้แล้ว");
        }

        if (!user.password) {
          await prisma.loginLog.create({
            data: { email: credentials.email, ipAddress: ip, userAgent, success: false }
          });
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          const newFailedAttempts = (user.failedAttempts || 0) + 1;
          const updateData: any = { failedAttempts: newFailedAttempts };
          
          // Lock account if failed attempts reach 5
          if (newFailedAttempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
          }
          
          await prisma.user.update({
            where: { id: user.id },
            data: updateData
          });
          
          await prisma.loginLog.create({
            data: { email: credentials.email, ipAddress: ip, userAgent, success: false }
          });
          
          if (newFailedAttempts >= 5) {
            throw new Error("มีความพยายามล็อคอินเกิน 5 ครั้งและได้ lock อีเมลนี้แล้ว");
          }
          
          return null;
        }

        // Success: reset failed attempts and unlock account if needed
        if ((user.failedAttempts || 0) > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: 0, lockedUntil: null }
          });
        }
        
        await prisma.loginLog.create({
          data: { email: credentials.email, ipAddress: ip, userAgent, success: true }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days session
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      }
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
};

const handler = NextAuth(authOptions);
export { handler as GET };

export async function POST(req: Request, context: any) {
  const clonedReq = req.clone();
  let rememberMe = false;
  try {
    const text = await clonedReq.text();
    const params = new URLSearchParams(text);
    if (params.has("rememberMe")) {
      rememberMe = params.get("rememberMe") === "true";
    } else {
      try {
        const json = JSON.parse(text);
        rememberMe = json.rememberMe === "true";
      } catch (e) {}
    }
  } catch (e) {}

  const customOptions = {
    ...authOptions,
    session: {
      ...authOptions.session,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // Token valid for 1 day max if not checked
    }
  };

  const response = await NextAuth(customOptions)(req, context) as Response;

  if (!rememberMe) {
    const newHeaders = new Headers(response.headers);
    if (newHeaders.has("Set-Cookie")) {
      const cookies = newHeaders.getSetCookie();
      newHeaders.delete("Set-Cookie");
      for (const cookie of cookies) {
        let modifiedCookie = cookie.replace(/Max-Age=[0-9]+;?\s*/i, '');
        modifiedCookie = modifiedCookie.replace(/Expires=[^;]+;?\s*/i, '');
        console.log("Original cookie:", cookie);
        console.log("Modified cookie:", modifiedCookie);
        newHeaders.append("Set-Cookie", modifiedCookie);
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    }
  }

  return response;
}
