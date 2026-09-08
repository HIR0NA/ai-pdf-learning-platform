# Before / After Evidence 04: Rate Limiting & Anti-IP Spoofing

---

## 1. Vulnerability Description
- **Threat/Vulnerability:** Insecure Design / Rate Limiter Bypass via IP Spoofing (OWASP Top 10 - A04)
- **Asset Affected:** AI API & Upload Endpoints (`/api/ai`, `/api/tools`, `/api/upload`)
- **Impact:** Attackers could fake client IP addresses using header `X-Forwarded-For: <random_ip>` to evade rate limiting, exhausting AI token budgets and overwhelming backend resources.

---

## 2. Before Fix (Vulnerable Code)
```typescript
// VULNERABLE: Blindly trusting X-Forwarded-For header
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // Flaw: Directly takes attacker-manipulated client header!
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}
```

---

## 3. After Fix (Remediated Code)
```typescript
// SECURED: Strict Trusted Proxy evaluation + Token-Bucket Rate Limiter
// src/lib/security.ts
export function getClientAddress(headers: Headers | Record<string, string | string[]>, options = {}) {
  const trustProxy = options.trustProxy ?? process.env.TRUST_PROXY === 'true';

  // If proxy is not explicitly trusted, ignore X-Forwarded-For entirely
  if (!trustProxy) {
    return 'direct-client';
  }

  const rawForwarded = readHeader(headers, 'x-forwarded-for');
  if (!rawForwarded) return 'direct-client';

  const parts = rawForwarded.split(',').map((part) => part.trim()).filter(Boolean);
  const hops = options.trustedProxyHops ?? Number(process.env.TRUSTED_PROXY_HOPS || 1);
  const targetIndex = parts.length - hops;

  return targetIndex >= 0 ? parts[targetIndex] : 'direct-client';
}

// src/lib/rate-limit.ts
export async function consumeRateLimit(key: string, limit: number, windowSeconds: number) {
  // Redis token-bucket / sliding window evaluation with fallback
  // Blocks requests exceeding configured threshold
}
```

---

## 4. Verification & Result
- Unit test `forwarded IP spoofing is ignored unless a trusted proxy is configured` **PASSED**.
- Unit test `rate limiter blocks request 11 without trusting a spoofed IP` **PASSED**.
