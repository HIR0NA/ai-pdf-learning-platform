# AI PDF Learning Platform

แพลตฟอร์ม AI Study Companion สำหรับอัปโหลด PDF แล้วอ่าน สรุป ถามตอบ และสร้าง Quiz, Flashcard และ Study Schedule โดยเก็บข้อมูลแยกตามผู้ใช้

## ฟีเจอร์

- NextAuth Email/Password, bcrypt password hash และ lockout เมื่อ Login ผิด
- RBAC: `STUDENT` และ `ADMIN` พร้อม Admin Dashboard และ 401/403 server guards
- PDF upload สูงสุด 10 MB พร้อมตรวจ MIME, นามสกุล, magic bytes และ private UUID storage
- Streaming Chat, Summary, Quiz, Flashcard และ Schedule จากเอกสาร
- PostgreSQL ผ่าน Prisma, Redis rate limiting และ AI providers: Gemini, Groq GPT-OSS, Qwen/BazaarLink

## Requirements

Node.js 22+ หรือ Bun, Docker Desktop และ Docker Compose หากใช้ชุดพัฒนาที่แนะนำ

## Quick Start ด้วย Docker

```powershell
Copy-Item .env.example .env
```

กำหนดค่าใน `.env`:

```env
NEXTAUTH_SECRET=ค่าสุ่มที่ยาวและปลอดภัย
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=รหัสผ่านอย่างน้อย12ตัว
STUDENT_EMAIL=student@example.com
STUDENT_PASSWORD=รหัสผ่านอีกชุดอย่างน้อย12ตัว
```

ใส่ API key ของ provider ที่ต้องการ แล้วรัน:

```powershell
docker compose up -d --build
docker compose ps
```

เปิด [http://localhost:3000](http://localhost:3000) โดย Compose จะทำ migration และ seed บัญชี Admin/Student ให้อัตโนมัติ

## Development บนเครื่อง

ถ้า Docker ใช้พอร์ต 3000 ให้ใช้พอร์ต 3001:

```powershell
bun install
bun run db:push
bun run db:seed
bun dev -- --port 3001
```

เปิด [http://localhost:3001](http://localhost:3001)

## Demo Roles

`seed_admin.js` ใช้ `ADMIN_EMAIL`/`ADMIN_PASSWORD` เป็น `ADMIN` และ `STUDENT_EMAIL`/`STUDENT_PASSWORD` เป็น `STUDENT` การสมัครสมาชิกใหม่จะเป็น `STUDENT` เสมอ หลังเปลี่ยน Role ให้ Logout/Login ใหม่เพื่อออก JWT session ใหม่

- Student: `/dashboard`
- Admin: `/admin`

## คำสั่งที่ใช้บ่อย

```powershell
bun run build
bun run lint
bun run test
bun run test:security
bun run db:push
bun run db:seed
docker compose down
```

## โครงสร้างสำคัญ

```text
src/app/                 Pages และ API Route Handlers
src/lib/auth.ts          NextAuth, bcrypt และ session callbacks
src/lib/rbac.ts          Roles และ authorization helpers
src/proxy.ts             early guard, rate limit และ 401/403
src/lib/security.ts      upload/path security
prisma/schema.prisma     PostgreSQL data model
seed_admin.js            Seed บัญชี Demo
docker-compose.yml       App, PostgreSQL และ Redis
tests/                   RBAC และ security regression tests
uploads/                 private runtime storage (ห้าม Commit)
```

## API หลัก

| Method | Endpoint | หน้าที่ | สิทธิ์ |
|---|---|---|---|
| POST | `/api/auth/register` | สมัครสมาชิก | Public |
| POST | `/api/auth/callback/credentials` | Login | Public |
| POST | `/api/upload` | อัปโหลด PDF | Authenticated |
| GET | `/api/files` | รายการไฟล์ | Owner |
| GET/PATCH/DELETE | `/api/files/[filename]` | อ่าน/แก้ชื่อ/ลบ | Owner หรือ Admin |
| POST | `/api/ai` | Streaming Chat | Owner |
| POST | `/api/tools` | Summary/Quiz/Flashcard/Schedule | Owner |
| GET | `/api/messages` | Chat history | Owner |
| GET | `/api/admin/overview` | Admin overview | Admin เท่านั้น |

## Security

อ่าน Threat Model, Secure SDLC, Risk Register, Privacy และ Incident Response ได้ที่ [SECURITY.md](SECURITY.md)

- ห้าม Commit `.env`, API keys, passwords หรือ `uploads/`
- API keys ใช้ฝั่ง Server เท่านั้น
- เอกสารต้องผ่าน ownership check ก่อนอ่านหรือส่งให้ AI

## License

โปรเจกต์นี้จัดทำเพื่อการศึกษาและการสาธิตระบบ AI PDF Learning
