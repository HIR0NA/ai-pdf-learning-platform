# Database Security & SQL Injection Prevention Report
**Database:** PostgreSQL 18  
**ORM:** Prisma Client v5.22.0  
**Database Name:** `pdf_learning_db`

---

## 1. SQL Injection Assessment & Prevention Mechanism
In this project, raw string concatenation queries (e.g. `db.query("SELECT * FROM User WHERE email = '" + email + "'")`) are strictly prohibited. All queries are executed through **Prisma ORM**, which internally translates queries into **Parameterized Prepared Statements** at the database driver level.

### Injection Test Payload Examples
When an attacker submits SQL injection payloads into input fields:
```text
admin@example.com' OR 1=1 --
' UNION SELECT null, email, password, role FROM "User" --
admin' AND SLEEP(5) --
```

### Server-Side Prisma Execution
```typescript
// src/lib/auth.ts
const user = await prisma.user.findUnique({
  where: { email }
});
```

### Underlying Parameterized PostgreSQL Query (Safe)
```sql
SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email", 
       "public"."User"."password", "public"."User"."role", "public"."User"."failedAttempts", 
       "public"."User"."lockedUntil" 
FROM "public"."User" 
WHERE "public"."User"."email" = $1 LIMIT $2 OFFSET $3;
-- Parameters: $1 = 'admin@example.com'' OR 1=1 --', $2 = 1, $3 = 0
```
**Result:** The payload is treated strictly as literal string data for parameter `$1`. No SQL command execution occurs. SQL Injection is mitigated by design.

---

## 2. Password Security & Storage
- Passwords are never stored in plaintext.
- Hashing Algorithm: **Bcrypt** with Cost Factor **12** (`bcrypt.hash(password, 12)`).
- Resilient against Rainbow Table attacks via unique cryptographic salt per user.

---

## 3. Database Least Privilege & Audit Logging
- **Least Privilege Principle:** Application connects through designated database credentials.
- **Audit Logging Table (`LoginLog`):** Every successful and failed authentication attempt is persisted with timestamp, IP address, user-agent, and status for incident investigation.
```sql
CREATE TABLE "LoginLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "userAgent" TEXT,
  "success" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
