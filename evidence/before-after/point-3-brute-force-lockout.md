# Before / After Evidence 03: Brute Force Protection & Account Lockout

---

## 1. Vulnerability Description
- **Threat/Vulnerability:** Identification and Authentication Failures / Credential Stuffing (OWASP Top 10 - A07)
- **Asset Affected:** Authentication Endpoint (`/api/auth/callback/credentials`)
- **Impact:** Attackers could launch automated brute-force attacks against student or admin accounts with limitless attempts until cracking the password.

---

## 2. Before Fix (Vulnerable Code)
```typescript
// VULNERABLE: No limit on failed login attempts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          // Flaw: Fails silently without counting attempts or locking
          return null; 
        }

        return user;
      }
    })
  ]
};
```

---

## 3. After Fix (Remediated Code)
```typescript
// SECURED: Persistent Failed Attempts Counter + 30-second Lockout + Audit Trail
// src/lib/auth.ts
export const LOCK_DURATION_SECONDS = 30;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials, req) {
        const email = credentials.email.trim().toLowerCase();
        const ip = getClientAddress(req?.headers || {});
        const userAgent = (req?.headers?.['user-agent'] || 'unknown') as string;

        const user = await prisma.user.findUnique({ where: { email } });

        // 1. Check if account is currently locked
        if (user?.lockedUntil && user.lockedUntil > new Date()) {
          const remainingSec = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
          await prisma.loginLog.create({ data: { email, ipAddress: ip, userAgent, success: false } });
          throw new Error(`LOCKED:${remainingSec}`);
        }

        // 2. Validate password
        const isValid = user?.password ? await bcrypt.compare(credentials.password, user.password) : false;

        if (!isValid) {
          // Increment failed attempts and lock if threshold is reached
          const nextAttempts = (user?.failedAttempts || 0) + 1;
          const shouldLock = nextAttempts >= 5;
          const lockedUntil = shouldLock ? new Date(Date.now() + LOCK_DURATION_SECONDS * 1000) : null;

          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { failedAttempts: nextAttempts, lockedUntil }
            });
          }

          // Persist audit record
          await prisma.loginLog.create({ data: { email, ipAddress: ip, userAgent, success: false } });
          return null;
        }

        // Reset failed counter on successful authentication
        await prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: 0, lockedUntil: null }
        });
        await prisma.loginLog.create({ data: { email, ipAddress: ip, userAgent, success: true } });

        return user;
      }
    })
  ]
};
```

---

## 4. Verification & Result
- 5 consecutive failed passwords trigger an immediate 30-second lockout.
- The user is notified with a live countdown timer on the login UI.
- All attempts are logged in the `LoginLog` database table for auditing.
