import NextAuth from 'next-auth';
import type { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

type AuthRouteContext = {
  params: Promise<{ nextauth?: string[] }>;
};

function authContext(request: NextRequest) {
  const nextauth = request.nextUrl.pathname
    .split('/')
    .filter(Boolean)
    .slice(2);

  return {
    params: Promise.resolve({ nextauth }),
  };
}

export async function GET(request: NextRequest, _context: AuthRouteContext) {
  return handler(request, authContext(request));
}

export async function POST(request: NextRequest, _context: AuthRouteContext) {
  return handler(request, authContext(request));
}
