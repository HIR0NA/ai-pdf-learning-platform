import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getClientAddress } from '@/lib/security';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email/Username', type: 'text', placeholder: 'email@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();
        const ip = getClientAddress(req?.headers || {});
        const userAgent = (req?.headers?.['user-agent'] || 'unknown') as string;

        const recentAttempts = await prisma.loginLog.count({
          where: {
            email,
            createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
            success: false,
          },
        });
        if (recentAttempts >= 5) {
          throw new Error('มีความพยายามล็อคอินเกิน 5 ครั้งและได้ lock อีเมลนี้แล้ว');
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await prisma.loginLog.create({ data: { email, ipAddress: ip, userAgent, success: false } });
          return null;
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await prisma.loginLog.create({ data: { email, ipAddress: ip, userAgent, success: false } });
          throw new Error('มีความพยายามล็อคอินเกิน 5 ครั้งและได้ lock อีเมลนี้แล้ว');
        }

        if (!user.password) {
          await prisma.loginLog.create({ data: { email, ipAddress: ip, userAgent, success: false } });
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          const newFailedAttempts = user.failedAttempts + 1;
          const lockedUntil = newFailedAttempts >= 5
            ? new Date(Date.now() + 15 * 60 * 1000)
            : user.lockedUntil;

          await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: newFailedAttempts, lockedUntil },
          });
          await prisma.loginLog.create({ data: { email, ipAddress: ip, userAgent, success: false } });

          if (newFailedAttempts >= 5) {
            throw new Error('มีความพยายามล็อคอินเกิน 5 ครั้งและได้ lock อีเมลนี้แล้ว');
          }
          return null;
        }

        if (user.failedAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: 0, lockedUntil: null },
          });
        }

        await prisma.loginLog.create({ data: { email, ipAddress: ip, userAgent, success: true } });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { role?: unknown; id?: unknown }).role = token.role;
        (session.user as typeof session.user & { role?: unknown; id?: unknown }).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
