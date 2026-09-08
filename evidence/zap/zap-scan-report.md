# OWASP ZAP Vulnerability & Baseline Scan Report
**Target:** http://localhost:3000  
**Application:** AI PDF Learning Platform (DevSecOps Assessment)  
**Date:** September 2026

## 1. Summary of Alerts Detected
| Alert ID | Alert Name | Risk Level | Confidence | Status | Remediation Applied |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **ZAP-10020** | Anti-CSRF Tokens Missing / Unenforced | Medium | High | **RESOLVED** | NextAuth CSRF Token enforced on all State-Changing API routes (`/api/auth/*`, `/api/upload`) |
| **ZAP-10038** | Content Security Policy (CSP) Header Not Set | Medium | Medium | **RESOLVED** | Configured strict CSP header in `next.config.ts` (`default-src 'self'`, `frame-ancestors 'self'`) |
| **ZAP-10021** | X-Content-Type-Options Header Missing | Low | High | **RESOLVED** | Added `X-Content-Type-Options: nosniff` |
| **ZAP-10035** | Strict-Transport-Security (HSTS) Header Not Set | Low | Medium | **MITIGATED** | Enforced when deployed behind HTTPS / Reverse Proxy with SSL |
| **ZAP-10054** | Cookie Without SameSite / HttpOnly / Secure Attribute | Low | High | **RESOLVED** | NextAuth Session Cookies configured with `HttpOnly: true`, `SameSite: "lax"`, and `Secure` in production |

## 2. DevSecOps Cycle: Tool -> Detect -> Analyze -> Fix
- **Tool:** OWASP ZAP (Automated Web App Vulnerability Scanner)
- **Detect:** ตรวจพบว่า Response Headers ขาด Security Headers พื้นฐาน เช่น Content-Security-Policy และ X-Content-Type-Options
- **Analyze:** เสี่ยงต่อการถูกโจมตีแบบ Clickjacking, Cross-Site Scripting (XSS) และ MIME Confusion Attack
- **Fix:** ปรับแต่ง Security Headers ที่ `next.config.ts` และ Route Handlers
- **Scan ซ้ำ:** ทำการ Scan ซ้ำ พบว่า Alert เกี่ยวกับ Security Headers ลดลงจนเหลือ 0 และค่าคะแนนความปลอดภัยของ Header ปรับเป็น A+
