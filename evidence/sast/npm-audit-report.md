# Dependency & SAST Security Analysis Report
**Target Application:** AI PDF Learning Platform  
**Tools Employed:** `npm audit` (Software Composition Analysis) & Node Native Test Runner (Security Unit Tests)

---

## 1. Dependency Scan (npm audit) — DevSecOps Lifecycle
```
Tool: npm audit
Target: package.json / package-lock.json dependencies (579 packages)
```

### [Step 1: Detect]
Initial scan identified a high-severity vulnerability in transitive dependency:
```
# npm audit report

browserslist  <=4.28.6
Severity: high
Browserslist: Unbounded memory growth (no cache eviction) via distinct query results, leading to eventual OOM - https://github.com/advisories/GHSA-c83g-rgw3-j3cx
Browserslist: Uncaught crash / prototype write via untrusted browserslist-stats.json custom stats (normalizeStats) - https://github.com/advisories/GHSA-73wf-gq98-2v4g
fix available via `npm audit fix`
node_modules/browserslist

1 high severity vulnerability
```

### [Step 2: Analyze]
- **Vulnerability:** GHSA-c83g-rgw3-j3cx / GHSA-73wf-gq98-2v4g
- **Impact:** Uncontrolled memory consumption (Denial of Service - DoS) during CSS/JS compilation. Potential prototype pollution crash.
- **Risk Rating:** High (CVSS 7.5)

### [Step 3: Fix]
Executed remediation command:
```bash
npm audit fix
```
Dependencies were updated and transitive locks were resolved cleanly without breaking changes.

### [Step 4: Retest]
Verification scan confirmed zero remaining vulnerabilities:
```
added 58 packages, changed 6 packages, and audited 579 packages in 7s
found 0 vulnerabilities
```

---

## 2. Automated Security & RBAC Unit Tests
Executed via `npm test` (`tests/security.test.ts` & `tests/rbac.test.ts`):

```
> ai-pdf-learning-platform@0.1.0 test
> node --experimental-strip-types --test tests/*.test.ts

✔ RBAC accepts only the supported roles (1.1ms)
✔ admin-only access rejects students (0.2ms)
✔ stored PDF filename accepts generated UUID names only (1.4ms)
✔ resolved document artifacts stay inside the upload root (0.5ms)
✔ forwarded IP spoofing is ignored unless a trusted proxy is configured (13.5ms)
✔ rate limiter blocks request 11 without trusting a spoofed IP (0.9ms)
✔ oversized upload requests are classified for HTTP 413 handling (0.2ms)
✔ regression: auth bypass and unsafe file retention code are absent (7.8ms)
✔ Groq GPT-OSS 120B provider is wired through API, UI, and Docker configuration (2.6ms)
✔ RBAC is enforced by proxy, admin API, page, menu, and seeded roles (3.5ms)

ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 727ms
```
