import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getClientAddress } from '@/lib/security';
import { normalizeRole } from '@/lib/rbac';

const prisma = new PrismaClient();

// Lock duration in seconds — shown as countdown on the login page
export const LOCK_DURATION_SECONDS = 30;

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

        const user = await prisma.user.findUnique({ where: { email } });

        // Check if account is currently locked
        if (user?.lockedUntil && user.lockedUntil > new Date()) {
          const remainingSec = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
          await prisma.loginLog.create({ data: { email, ipAddress: ip, userAgent, success: false } });
          throw new Error(`LOCKED:${remainingSec}`);
        }

        // Auto-unlock if lock period has expired
        if (user?.lockedUntil && user.lockedUntil <= new Date()) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: 0, lockedUntil: null },
          });
          user.failedAttempts = 0;
          user.lockedUntil = null;
        }

        if (!user) {
          await prisma.loginLog.create({ data: { email, ipAddress: ip, userAgent, success: false } });
          return null;
        }

        if (!user.password) {
          await prisma.loginLog.create({ data: { email, ipAddress: ip, userAgent, success: false } });
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          const newFailedAttempts = user.failedAttempts + 1;
          const lockedUntil = newFailedAttempts >= 5
            ? new Date(Date.now() + LOCK_DURATION_SECONDS * 1000)
            : null;

          await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: newFailedAttempts, lockedUntil },
          });
          await prisma.loginLog.create({ data: { email, ipAddress: ip, userAgent, success: false } });

          if (newFailedAttempts >= 5) {
            throw new Error(`LOCKED:${LOCK_DURATION_SECONDS}`);
          }
          return null;
        }

        // Successful login — reset counters
        if (user.failedAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: 0, lockedUntil: null },
          });
        }

        await prisma.loginLog.create({ data: { email, ipAddress: ip, userAgent, success: true } });
        const role = normalizeRole(user.role);
        if (!role) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
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
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = normalizeRole(token.role) ?? 'STUDENT';
        session.user.id = String(token.id ?? '');
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
