import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Basic in-memory rate limiter (For production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

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
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    console.log(`[ACCESS LOG] ${new Date().toISOString()} | IP: ${ip} | METHOD: ${request.method} | URL: ${pathname}`);
  }

  // Phase 4: API Security & Rate Limiting
  if (pathname.startsWith('/api/ai') || pathname.startsWith('/api/upload')) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || 'anonymous';
    const now = Date.now();
    const rateLimitData = rateLimitMap.get(ip);

    if (rateLimitData && rateLimitData.resetTime > now) {
      if (rateLimitData.count >= MAX_REQUESTS) {
        return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitData.resetTime - now) / 1000).toString(),
            'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
          },
        });
      }
      rateLimitData.count++;
      rateLimitMap.set(ip, rateLimitData);
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    }
  }

  // Dashboard Protection
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ req: request });
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(url);
    }
  }

  // Phase 2: RBAC (Role-Based Access Control)
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req: request });
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/dashboard/:path*'],
};
