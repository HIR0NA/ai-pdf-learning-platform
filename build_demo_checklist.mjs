import fs from 'node:fs/promises';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const outputDir = 'C:/workspace/ai-pdf-learning-platform/outputs/demo-readiness-2026-08-25';
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const summary = workbook.worksheets.add('สรุป');
const checklist = workbook.worksheets.add('Checklist');
const sources = workbook.worksheets.add('หลักฐาน');

for (const sheet of [summary, checklist, sources]) {
  sheet.showGridLines = false;
}

const colors = {
  navy: '#24113E',
  purple: '#4B246B',
  mauve: '#85506D',
  pink: '#DFB6B2',
  ink: '#24113E',
  light: '#F7F3FA',
  green: '#D9F2E3',
  greenText: '#17663A',
  amber: '#FFF0C2',
  amberText: '#8A5B00',
  red: '#FAD7D7',
  redText: '#9B1C1C',
  gray: '#E9E2EE',
};

const statusDone = '✅ ทำแล้ว';
const statusPartial = '⚠️ ทำบางส่วน';
const statusTodo = '❌ ยังไม่ได้ทำ';
const statuses = [statusDone, statusPartial, statusTodo];

const rows = [
  ['Authentication', 'Login ด้วย Email/Password', statusPartial, 'CredentialsProvider ค้นหาด้วย email ใน auth.ts; DB มีบัญชีจริง', 'src/lib/auth.ts; src/app/login/page.tsx', 'ระบบยังไม่รองรับ Username แม้ UI ระบุ Email/Username'],
  ['Authentication', 'Password Hash', statusDone, 'bcrypt.hash(..., 12) ตอน Register และ Seed', 'src/lib/auth.ts; src/app/api/auth/register/route.ts; seed_admin.js', 'ไม่มี'],
  ['Authentication', 'แจ้งเตือน/Lockout เมื่อ Login ผิด', statusDone, 'failedAttempts, LoginLog และล็อกครบ 5 ครั้ง 30 วินาที', 'src/lib/auth.ts; prisma/schema.prisma', 'ไม่มี'],
  ['Authentication', 'Session หลัง Login', statusDone, 'NextAuth JWT; maxAge 30 วัน', 'src/lib/auth.ts', 'ไม่มี'],
  ['Authentication', 'Logout ทำลาย Session', statusDone, 'Navbar เรียก signOut พร้อม callbackUrl', 'src/components/Navbar.tsx', 'ไม่มี'],
  ['Authentication', 'ป้องกัน Dashboard URL โดยตรง', statusDone, 'proxy ตรวจ token สำหรับ /dashboard', 'src/proxy.ts', 'ไม่มี'],
  ['Authentication', 'Protected API ตรวจ Server Session', statusDone, 'API หลักเรียก getServerSession', 'src/app/api/*/route.ts', 'ไม่มี'],
  ['Authentication', 'Cookie Security/Expiration', statusDone, 'httpOnly, sameSite=lax, secure production, maxAge', 'src/lib/auth.ts', 'ทดสอบ HTTPS ตอน Deploy'],
  ['Database', 'PostgreSQL Connection', statusDone, 'Schema provider=postgresql; Docker DB healthy; query User สำเร็จ', 'prisma/schema.prisma; docker-compose.yml', 'ไม่มี'],
  ['Database', 'อ่านข้อมูลจาก Database จริง', statusDone, 'Prisma query Users/Documents/Messages/Tools', 'src/lib/admin-overview.ts; src/app/api/files/route.ts', 'ไม่มี'],
  ['Database', 'เพิ่มข้อมูลจริง', statusDone, 'Register, Upload, Message และ LearningTool ใช้ create/upsert', 'src/app/api/auth/register/route.ts; src/app/api/upload/route.ts; src/app/api/ai/route.ts; src/app/api/tools/route.ts', 'ไม่มี'],
  ['Database', 'แก้ไข/ลบข้อมูล', statusDone, 'PATCH/DELETE เอกสารและลบ artifacts', 'src/app/api/files/[filename]/route.ts', 'ไม่มี'],
  ['Database', 'Application DB Account', statusPartial, 'Docker ใช้ postgres/postgres ซึ่งเป็น superuser', 'docker-compose.yml', 'สร้าง DB user เฉพาะแอป'],
  ['Database', 'Secrets ใน .env และไม่ Commit', statusDone, '.env ไม่ถูก Track; .gitignore มี .env*; .env.example มี placeholders', '.env.example; .gitignore', 'ตรวจ GitHub Secret Scanning เพิ่ม'],
  ['Database', 'ไม่มี SQLite Artifact สับสน', statusPartial, 'พบ prisma/dev.db ถูก Track แต่ Schema ใช้ PostgreSQL', 'prisma/dev.db; prisma/schema.prisma', 'ลบจาก Gitหรือระบุเป็น Legacy'],
  ['Study', 'แสดงรายการวิชา', statusTodo, 'ไม่พบ Subject model, API หรือหน้า Subject', 'prisma/schema.prisma; src/app/api', 'เพิ่ม Subject model/API/UI'],
  ['Study', 'เพิ่มวิชาและบันทึกลง DB', statusTodo, 'ไม่พบ create Subject flow', 'prisma/schema.prisma; src/app/api', 'เพิ่ม POST /api/subjects'],
  ['Study', 'บันทึกการเรียน', statusTodo, 'ไม่พบ StudyRecord model หรือ API', 'prisma/schema.prisma; src/app/api', 'เพิ่ม StudyRecord และผูก User/Subject'],
  ['Study', 'ดูประวัติการเรียน', statusTodo, 'ไม่พบ Study History endpoint/page', 'src/app/dashboard; src/app/api', 'เพิ่ม GET API และหน้าประวัติ'],
  ['Study', 'เพิ่ม/เก็บคำถาม', statusPartial, 'Quiz/Flashcard JSON เก็บใน LearningTool แต่ไม่มี Question model', 'prisma/schema.prisma; src/app/api/tools/route.ts', 'เพิ่ม Question/QuestionBank CRUD'],
  ['Study', 'ประวัติการใช้งานผูก User', statusDone, 'Message, Document, LearningTool มี userId และ query จำกัดตาม userId', 'prisma/schema.prisma; src/app/api/messages/route.ts; src/app/api/files/route.ts', 'เพิ่ม Integration Test IDOR'],
  ['Study', 'AI PDF Chat/Summary/Quiz/Flashcard', statusDone, 'Upload และ AI tools ทำงานผ่าน API + Prisma', 'src/app/api/upload/route.ts; src/app/api/ai/route.ts; src/app/api/tools/route.ts', 'ไม่มี'],
  ['RBAC', 'มี Role ใน Database', statusDone, 'User.role และ normalizeRole', 'prisma/schema.prisma; src/lib/rbac.ts', 'ไม่มี'],
  ['RBAC', 'Student Login/Demo', statusDone, 'Seed และ PostgreSQL มี Student accounts', 'seed_admin.js; DB User table', 'ไม่มี'],
  ['RBAC', 'Admin Login/Demo', statusDone, 'Seed และ PostgreSQL มี Admin account', 'seed_admin.js; DB User table', 'ไม่มี'],
  ['RBAC', 'Lecturer Role', statusTodo, 'APP_ROLES มีแค่ STUDENT, ADMIN; ไม่พบ Lecturer', 'src/lib/rbac.ts; seed_admin.js', 'เพิ่ม LECTURER และบัญชี Demo'],
  ['RBAC', 'เมนูแตกต่างตาม Role', statusDone, 'Navbar แยก Admin Console กับ Student Overview', 'src/components/Navbar.tsx', 'เพิ่ม Lecturer menu หลังเพิ่ม Role'],
  ['RBAC', 'Admin Page Server Guard', statusDone, 'page และ proxy ใช้ isAdmin; non-admin ได้ 403', 'src/app/admin/page.tsx; src/proxy.ts', 'ไม่มี'],
  ['RBAC', 'Admin API Server Guard', statusDone, '/api/admin/overview ตรวจ 401/403', 'src/app/api/admin/overview/route.ts', 'ไม่มี'],
  ['RBAC', 'ป้องกันข้อมูลข้าม User', statusDone, 'เอกสาร/ข้อความ/Tools ใช้ userId ownership check', 'src/app/api/files/[filename]/route.ts; src/app/api/messages/route.ts; src/app/api/tools/route.ts', 'เพิ่ม E2E IDOR test'],
  ['RBAC', 'Admin จัดการระบบครบ', statusPartial, 'Admin Dashboard ดูสถิติ/Export แต่ยังไม่มีจัดการ Role/User', 'src/app/admin/AdminDashboard.tsx; src/lib/admin-overview.ts', 'เพิ่ม user/role management หากอยู่ใน Scope'],
  ['UX/Demo', 'Dashboard ใช้ข้อมูลจริงทั้งหมด', statusPartial, 'Overview มี KPI/กราฟ hardcode เช่น 24 files, 1,284 chats', 'src/app/dashboard/overview/page.tsx', 'เปลี่ยนเป็น API จาก DB'],
];

const header = [['หมวด', 'รายการตรวจ', 'สถานะ (เลือกเปลี่ยนได้)', 'หลักฐานจากโปรเจกต์', 'ไฟล์ที่เกี่ยวข้อง', 'สิ่งที่ต้องแก้']];
checklist.getRange('A1:F1').merge();
checklist.getRange('A1').values = [['AI Study Companion — Demo Readiness Checklist']];
checklist.getRange('A2:F2').values = header;
checklist.getRange(`A3:F${rows.length + 2}`).values = rows;
checklist.getRange(`C3:C${rows.length + 2}`).dataValidation = { rule: { type: 'list', values: statuses } };
checklist.getRange('A1:F1').format = { fill: colors.navy, font: { bold: true, color: '#FFFFFF', size: 16 }, horizontalAlignment: 'center', verticalAlignment: 'center' };
checklist.getRange('A2:F2').format = { fill: colors.purple, font: { bold: true, color: '#FFFFFF' }, wrapText: true, verticalAlignment: 'center' };
checklist.getRange(`A3:F${rows.length + 2}`).format = { fill: '#FFFFFF', font: { color: colors.ink }, wrapText: true, verticalAlignment: 'top', borders: { preset: 'inside', style: 'thin', color: '#E2D9E8' } };
checklist.getRange(`C3:C${rows.length + 2}`).format = { horizontalAlignment: 'center', verticalAlignment: 'center', font: { bold: true } };
checklist.getRange(`C3:C${rows.length + 2}`).conditionalFormats.add('containsText', { text: statusDone, format: { fill: colors.green, font: { color: colors.greenText, bold: true } } });
checklist.getRange(`C3:C${rows.length + 2}`).conditionalFormats.add('containsText', { text: statusPartial, format: { fill: colors.amber, font: { color: colors.amberText, bold: true } } });
checklist.getRange(`C3:C${rows.length + 2}`).conditionalFormats.add('containsText', { text: statusTodo, format: { fill: colors.red, font: { color: colors.redText, bold: true } } });
checklist.getRange(`A3:A${rows.length + 2}`).format.font = { bold: true, color: colors.purple };
checklist.getRange('A1:F1').format.rowHeight = 32;
checklist.getRange('A2:F2').format.rowHeight = 30;
checklist.getRange(`A3:F${rows.length + 2}`).format.rowHeight = 42;
for (const [col, width] of [['A', 16], ['B', 30], ['C', 20], ['D', 52], ['E', 48], ['F', 44]]) checklist.getRange(`${col}:${col}`).format.columnWidth = width;
checklist.freezePanes.freezeRows(2);
checklist.tables.add(`A2:F${rows.length + 2}`, true, 'DemoChecklistTable');

summary.getRange('A1:H1').merge();
summary.getRange('A1').values = [['AI Study Companion — สรุปความพร้อมก่อน Demo']];
summary.getRange('A2:H2').merge();
summary.getRange('A2').values = [['สถานะในตาราง Checklist เปลี่ยนได้จาก dropdown ในคอลัมน์ C และสีจะเปลี่ยนอัตโนมัติ']];
summary.getRange('A1:H1').format = { fill: colors.navy, font: { bold: true, color: '#FFFFFF', size: 18 }, horizontalAlignment: 'center', verticalAlignment: 'center' };
summary.getRange('A2:H2').format = { fill: colors.light, font: { italic: true, color: colors.purple }, horizontalAlignment: 'center' };
summary.getRange('A4:B8').values = [
  ['ตัวชี้วัด', 'ค่า'],
  ['รายการทั้งหมด', null],
  ['ทำแล้ว', null],
  ['ทำบางส่วน', null],
  ['ยังไม่ได้ทำ', null],
];
summary.getRange('B5:B8').formulas = [[`=COUNTA('Checklist'!B3:B${rows.length + 2})`], [`=COUNTIF('Checklist'!C3:C${rows.length + 2},"${statusDone}")`], [`=COUNTIF('Checklist'!C3:C${rows.length + 2},"${statusPartial}")`], [`=COUNTIF('Checklist'!C3:C${rows.length + 2},"${statusTodo}")`]];
summary.getRange('D4:E8').values = [
  ['หมวดคะแนน', 'คะแนนโดยประมาณ'],
  ['Authentication และ Session', 9],
  ['Database และฟังก์ชันหลัก', 5],
  ['RBAC', 6],
  ['รวม / 30', null],
];
summary.getRange('E8').formulas = [['=SUM(E5:E7)']];
summary.getRange('A4:B4').format = { fill: colors.purple, font: { bold: true, color: '#FFFFFF' } };
summary.getRange('D4:E4').format = { fill: colors.purple, font: { bold: true, color: '#FFFFFF' } };
summary.getRange('A5:B8').format = { fill: '#FFFFFF', borders: { preset: 'all', style: 'thin', color: '#E2D9E8' } };
summary.getRange('D5:E8').format = { fill: '#FFFFFF', borders: { preset: 'all', style: 'thin', color: '#E2D9E8' } };
summary.getRange('B6').format = { fill: colors.green, font: { bold: true, color: colors.greenText } };
summary.getRange('B7').format = { fill: colors.amber, font: { bold: true, color: colors.amberText } };
summary.getRange('B8').format = { fill: colors.red, font: { bold: true, color: colors.redText } };
summary.getRange('E8').format = { fill: colors.pink, font: { bold: true, color: colors.ink, size: 14 } };
summary.getRange('A10:H10').merge();
summary.getRange('A10').values = [['สิ่งที่ต้องทำก่อน Demo — เรียงตามความสำคัญ']];
summary.getRange('A10:H10').format = { fill: colors.purple, font: { bold: true, color: '#FFFFFF' } };
summary.getRange('A11:H15').values = [
  ['ลำดับ', 'ระดับ', 'รายการ', 'ไฟล์หลัก', 'ผลกระทบ', '', '', ''],
  [1, '🔴 สำคัญมาก', 'เพิ่ม Lecturer Role และบัญชี Demo', 'src/lib/rbac.ts; seed_admin.js; prisma/schema.prisma', 'RBAC ไม่ครบตามเกณฑ์', '', '', ''],
  [2, '🔴 สำคัญมาก', 'เพิ่ม Subject / StudyRecord / Question Bank', 'prisma/schema.prisma; src/app/api/', 'ฟังก์ชัน AI Study Companion ยังไม่ครบ', '', '', ''],
  [3, '🟠 สำคัญ', 'แยกเมนูและหน้าสำหรับ Lecturer', 'src/components/Navbar.tsx; src/proxy.ts', 'สาธิตความต่างของ Role ไม่ครบ', '', '', ''],
  [4, '🟡 ควรปรับปรุง', 'เปลี่ยน Dashboard Overview จาก Mock เป็น Database', 'src/app/dashboard/overview/page.tsx', 'หลักฐาน Database บนหน้า Student ยังไม่ชัด', '', '', ''],
];
summary.getRange('A11:H11').format = { fill: colors.mauve, font: { bold: true, color: '#FFFFFF' } };
summary.getRange('A12:H15').format = { fill: '#FFFFFF', wrapText: true, verticalAlignment: 'top', borders: { preset: 'inside', style: 'thin', color: '#E2D9E8' } };
summary.getRange('B12:B12').format = { fill: colors.red, font: { bold: true, color: colors.redText } };
summary.getRange('B13:B13').format = { fill: colors.red, font: { bold: true, color: colors.redText } };
summary.getRange('B14:B14').format = { fill: colors.amber, font: { bold: true, color: colors.amberText } };
summary.getRange('B15:B15').format = { fill: '#FFF7D6', font: { bold: true, color: colors.amberText } };
summary.getRange('A18:H18').merge();
summary.getRange('A18').values = [['Demo Flow 5–8 นาที']];
summary.getRange('A18:H18').format = { fill: colors.purple, font: { bold: true, color: '#FFFFFF' } };
summary.getRange('A19:B27').values = [
  ['ลำดับ', 'ขั้นตอน'],
  [1, 'Login ด้วย Student'],
  [2, 'แสดง Dashboard และ Upload PDF'],
  [3, 'ถามคำถาม / สร้าง Summary หรือ Flashcard'],
  [4, 'Refresh และแสดงประวัติจาก Database'],
  [5, 'Logout แล้ว Login ด้วย Admin'],
  [6, 'แสดง Admin Dashboard และ Login Logs'],
  [7, 'ลองเรียก Admin API ด้วย Student Session ให้เห็น 403'],
  [8, 'สรุป Authentication + PostgreSQL + RBAC'],
];
summary.getRange('A19:B19').format = { fill: colors.mauve, font: { bold: true, color: '#FFFFFF' } };
summary.getRange('A20:B27').format = { fill: '#FFFFFF', borders: { preset: 'inside', style: 'thin', color: '#E2D9E8' } };
for (const [col, width] of [['A', 12], ['B', 22], ['C', 46], ['D', 46], ['E', 30], ['F', 10], ['G', 10], ['H', 10]]) summary.getRange(`${col}:${col}`).format.columnWidth = width;
summary.getRange('A1:H1').format.rowHeight = 34;
summary.getRange('A11:H15').format.rowHeight = 54;
summary.freezePanes.freezeRows(2);

sources.getRange('A1:D1').merge();
sources.getRange('A1').values = [['แหล่งหลักฐานที่ใช้ตรวจ']];
sources.getRange('A1:D1').format = { fill: colors.navy, font: { bold: true, color: '#FFFFFF', size: 16 }, horizontalAlignment: 'center' };
sources.getRange('A3:D3').values = [['ประเภท', 'รายการ', 'สิ่งที่ตรวจพบ', 'หมายเหตุ']];
sources.getRange('A4:D11').values = [
  ['Source', 'Authentication', 'NextAuth Credentials + bcrypt + JWT + lockout', 'src/lib/auth.ts'],
  ['Source', 'RBAC', 'รองรับ STUDENT และ ADMIN เท่านั้น', 'src/lib/rbac.ts'],
  ['Source', 'Middleware', 'ป้องกัน /dashboard, /admin และ /api/admin', 'src/proxy.ts'],
  ['Source', 'Database Schema', 'PostgreSQL; User/Document/Message/LearningTool', 'prisma/schema.prisma'],
  ['Runtime', 'Docker', 'PostgreSQL healthy; query User สำเร็จ', 'docker-compose.yml'],
  ['Runtime', 'Seed Users', 'พบ ADMIN 1 และ STUDENT 2 ใน DB จริง', 'seed_admin.js + PostgreSQL'],
  ['Source', 'Study Functions', 'ไม่พบ Subject/StudyRecord/Question model', 'ต้องพัฒนาต่อ'],
  ['Source', 'Dashboard Overview', 'KPI/กราฟบางส่วนเป็น hardcode', 'src/app/dashboard/overview/page.tsx'],
];
sources.getRange('A3:D3').format = { fill: colors.purple, font: { bold: true, color: '#FFFFFF' } };
sources.getRange('A4:D11').format = { fill: '#FFFFFF', wrapText: true, verticalAlignment: 'top', borders: { preset: 'inside', style: 'thin', color: '#E2D9E8' } };
for (const [col, width] of [['A', 14], ['B', 24], ['C', 52], ['D', 42]]) sources.getRange(`${col}:${col}`).format.columnWidth = width;
sources.getRange('A4:D11').format.rowHeight = 38;
sources.freezePanes.freezeRows(3);

const inspect = await workbook.inspect({ kind: 'table', range: 'สรุป!A1:H27', include: 'values,formulas', tableMaxRows: 27, tableMaxCols: 8, tableMaxCellChars: 120 });
console.log(inspect.ndjson);
const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options: { useRegex: true, maxResults: 100 }, summary: 'formula error scan' });
console.log(errors.ndjson);

for (const [sheetName, range] of [['สรุป', 'A1:H27'], ['Checklist', `A1:F${rows.length + 2}`], ['หลักฐาน', 'A1:D11']]) {
  const preview = await workbook.render({ sheetName, range, scale: 1, format: 'png' });
  await fs.writeFile(`${outputDir}/${sheetName}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/ai-study-companion-demo-checklist.xlsx`);
console.log(`SAVED ${outputDir}/ai-study-companion-demo-checklist.xlsx`);
