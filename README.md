# 📚 AI PDF Learning Platform (แพลตฟอร์มการเรียนรู้ผ่าน PDF ด้วย AI)

แพลตฟอร์มการเรียนรู้อัจฉริยะแบบ Full-Stack ที่พัฒนาด้วย **Next.js** สร้างขึ้นมาเพื่อช่วยเหลือนักเรียน นักศึกษา และคนทำงานในการดึงข้อมูลสำคัญ, สร้างแบบทดสอบ (Quiz), สรุปเนื้อหา และโต้ตอบกับไฟล์เอกสาร PDF ได้อย่างมีประสิทธิภาพผ่านเทคโนโลยี AI

## 🌟 ฟีเจอร์หลัก (Key Features)

- **📄 การจัดการและวิเคราะห์ไฟล์ PDF (PDF Parsing):** สามารถอัปโหลดและดึงข้อความจากไฟล์เอกสาร PDF ได้อย่างรวดเร็วและแม่นยำ
- **🤖 การโต้ตอบด้วยผู้ช่วย AI (AI-Powered Interactions):** 
  - พูดคุยและถาม-ตอบกับเนื้อหาในเอกสาร
  - สร้างบทสรุปเนื้อหาที่สำคัญ (Summarization)
  - ขับเคลื่อนด้วยพลังของ Google Gemini AI
- **🧠 เครื่องมือช่วยการเรียนรู้ (Learning Tools):** 
  - สร้างแบบทดสอบ (Quizzes) อัตโนมัติจากเนื้อหาใน PDF
  - สร้างแฟลชการ์ด (Flashcards) เพื่อทบทวนความจำ
  - จัดตารางการอ่านและการเรียนรู้ (Study Schedules)
- **🔐 ระบบรักษาความปลอดภัยและการยืนยันตัวตน (Authentication & Security):** 
  - ระบบล็อกอินและสมัครสมาชิกที่ปลอดภัยด้วย NextAuth.js
  - มีการกำหนดสิทธิ์ผู้ใช้งาน (Role-based Access) เช่น สิทธิ์ผู้ใช้ทั่วไป หรือผู้ดูแลระบบ
  - มีระบบบันทึกประวัติการล็อกอิน (Login Logs) และระบบล็อกบัญชีชั่วคราวเมื่อเข้าสู่ระบบผิดพลาดหลายครั้ง
- **📊 การแสดงผลข้อมูล (Data Visualization):** แสดงกราฟ แผนภูมิ และโครงสร้างข้อมูลแบบไดนามิก ด้วย Recharts และ Mermaid.js
- **🗄️ โครงสร้างฐานข้อมูลที่แข็งแกร่ง (Robust Database):** จัดการและออกแบบโครงสร้างข้อมูล (Data Modeling) ผ่าน Prisma ORM ที่เชื่อมต่อกับฐานข้อมูล SQLite (สามารถปรับสเกลไปใช้ PostgreSQL หรือ MySQL ได้อย่างง่ายดายในอนาคต)

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend & Backend Framework:** [Next.js](https://nextjs.org) (ใช้งานระบบ App Router)
- **Database ORM:** [Prisma](https://www.prisma.io)
- **Database Engine:** SQLite (เหมาะสำหรับโหมดนักพัฒนา)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (เข้ารหัสผ่านอย่างปลอดภัยด้วย `bcryptjs`)
- **AI Integration:** Google Generative AI SDK (`@google/generative-ai`) และ Vercel AI SDK
- **Data Visualization (กราฟและแผนภูมิ):** Recharts, Mermaid.js
- **Styling & UI:** Tailwind CSS (มาพร้อม Next.js) และไอคอนจาก Lucide React
- **PDF Extraction:** `pdf-parse`

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Getting Started)

### 1. ติดตั้งแพ็กเกจและ Dependencies
เปิด Terminal ให้อยู่ในโฟลเดอร์โปรเจกต์ (ที่มีไฟล์ `package.json`) และพิมพ์คำสั่งเพื่อติดตั้งเครื่องมือที่จำเป็นทั้งหมด:
```bash
npm install
```

### 2. ตั้งค่าตัวแปรระบบ (Environment Variables)
โปรเจกต์นี้จำเป็นต้องตั้งค่า Environment Variables โดยให้ทำการคัดลอกไฟล์ `.env.example` แล้วเปลี่ยนชื่อเป็น `.env` หรือสร้างไฟล์ `.env` ขึ้นมาใหม่ จากนั้นกำหนดค่าตัวแปรหลักๆ ดังนี้:
- `DATABASE_URL` (พาธสำหรับไฟล์ฐานข้อมูล SQLite เช่น `file:./dev.db`)
- `NEXTAUTH_SECRET` (รหัสความลับสำหรับระบบ Authentication - ควรตั้งให้ซับซ้อน)
- ตัวแปรสำหรับ AI API Key เช่น Google Gemini API Key

### 3. การสร้างและการเชื่อมต่อฐานข้อมูล (Database Setup)
หลังจากตั้งค่าไฟล์ `.env` แล้ว ให้รันคำสั่งของ Prisma เพื่อสร้างโครงสร้างตารางลงในฐานข้อมูล:
```bash
# ประมวลผล Prisma Client ใหม่
npx prisma generate

# อัปเดตและสร้าง Schema ลงในฐานข้อมูล SQLite
npx prisma db push
```

### 4. รันโปรเจกต์ในโหมดนักพัฒนา (Run the Development Server)
เมื่อติดตั้งทุกอย่างและเตรียมฐานข้อมูลเรียบร้อยแล้ว ให้เริ่มรันเซิร์ฟเวอร์:
```bash
npm run dev
```
จากนั้นเปิดเบราว์เซอร์และเข้าไปที่ [http://localhost:3000](http://localhost:3000) (หรือพอร์ตอื่นที่แสดงใน Terminal เช่น 3001, 3002) เพื่อเริ่มใช้งานแพลตฟอร์ม

## 📂 โครงสร้างโฟลเดอร์ในโปรเจกต์ (Project Structure Highlights)
- `/src/app` - พื้นที่หลักสำหรับไฟล์ระบบหน้าเว็บ (Pages) และ API Routes ของ Next.js (App Router)
- `/src/components` - ชิ้นส่วน UI คอมโพเนนต์ที่สามารถนำไปใช้ซ้ำในหน้าอื่นๆ ได้ (Reusable Components)
- `/src/lib` - ฟังก์ชันช่วยเหลือ (Utility Functions), การเชื่อมต่อ AI Service, และลอจิกพื้นฐาน
- `/src/context` - ไฟล์สำหรับจัดการ State ข้ามคอมโพเนนต์ (Global State) ใน React
- `/prisma` - โฟลเดอร์เก็บไฟล์ตั้งค่าฐานข้อมูล (`schema.prisma`) และฐานข้อมูล SQLite
- `/public` - พื้นที่เก็บรูปภาพ สื่อต่างๆ (Static Assets) และโฟลเดอร์อัปโหลด
- `/middleware.ts` - ฟังก์ชันดักจับ (Middleware) สำหรับตรวจสอบสิทธิ์การเข้าถึงหน้าเว็บของระบบล็อกอิน

## 📜 ลิขสิทธิ์ (License)
โปรเจกต์นี้ถูกสร้างขึ้นเพื่อจุดประสงค์ทางการศึกษาและการเรียนรู้
