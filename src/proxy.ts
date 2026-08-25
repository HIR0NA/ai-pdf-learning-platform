import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { consumeRateLimit } from '@/lib/rate-limit';
import { getClientAddress } from '@/lib/security';
import { isAdmin } from '@/lib/rbac';

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

function getRequestToken(request: NextRequest) {
  return getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Initialize default headers for CORS
  const headers = new Headers(request.headers);
  const origin = request.headers.get('origin') || '';
  
  // CORS Configuration: Only allow specific domains or localhost in development
  const allowedOrigins = ['http://localhost:3000'];
  const res = NextResponse.next({
    request: { headers }
  });

  if (allowedOrigins.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Handle preflight CORS requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: res.headers });
  }

  // Phase 5: API Security Headers
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Phase 6: Access Logging for all API routes
  if (pathname.startsWith('/api/')) {
    const ip = getClientAddress(request.headers);
    console.log(`[ACCESS LOG] ${new Date().toISOString()} | IP: ${ip} | METHOD: ${request.method} | URL: ${pathname}`);
  }

  // Phase 4: API Security & Rate Limiting
  if (pathname.startsWith('/api/ai') || pathname.startsWith('/api/upload')) {
    const token = await getRequestToken(request);
    const identity = token?.id
      ? `user:${String(token.id)}`
      : `network:${getClientAddress(request.headers)}`;

    try {
      const rateLimit = await consumeRateLimit(
        `${identity}:${pathname}`,
        MAX_REQUESTS,
        RATE_LIMIT_WINDOW_MS / 1000,
      );

      if (!rateLimit.allowed) {
        return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfterSeconds),
            'X-RateLimit-Remaining': '0',
            'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
          },
        });
      }
      res.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    } catch (error) {
      console.error('Rate limiter unavailable:', error);
      return NextResponse.json(
        { error: 'Rate limiter temporarily unavailable' },
        { status: 503, headers: { 'Retry-After': '5' } },
      );
    }
  }

  // Dashboard Protection
  if (pathname.startsWith('/dashboard')) {
    const token = await getRequestToken(request);
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(url);
    }
  }

  // Admin APIs must return machine-readable 401/403 responses.
  if (pathname.startsWith('/api/admin')) {
    const token = await getRequestToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin(token.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Admin pages return a real 403 before rendering for authenticated non-admin users.
  if (pathname.startsWith('/admin')) {
    const token = await getRequestToken(request);
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(url);
    }
    if (!isAdmin(token.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return res;
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/dashboard/:path*'],
};
