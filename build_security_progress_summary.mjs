import fs from "node:fs/promises";
import path from "node:path";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs/security-progress-summary-20260823");
await fs.mkdir(outputDir, { recursive: true });

const wb = Workbook.create();
const dashboard = wb.worksheets.add("Dashboard");
const progress = wb.worksheets.add("สถานะโครงการ");
const tests = wb.worksheets.add("Security Tests");
const risks = wb.worksheets.add("Risk Register");
const sdlc = wb.worksheets.add("Secure SDLC");
const architecture = wb.worksheets.add("Architecture & API");
const settings = wb.worksheets.add("ตั้งค่า");

const COLORS = {
  navy: "#0F172A", blue: "#1D4ED8", sky: "#DBEAFE", white: "#FFFFFF",
  slate: "#475569", light: "#F8FAFC", line: "#CBD5E1", green: "#DCFCE7",
  greenText: "#166534", amber: "#FEF3C7", amberText: "#92400E",
  gray: "#E5E7EB", grayText: "#374151", red: "#FEE2E2", redText: "#991B1B",
  purple: "#EDE9FE", purpleText: "#5B21B6"
};

const statuses = ["เสร็จแล้ว", "กำลังพัฒนา", "ยังไม่เริ่ม", "มีปัญหา"];

function titleBand(sheet, range, title, subtitle = "") {
  const r = sheet.getRange(range);
  r.merge();
  r.values = [[subtitle ? `${title}\n${subtitle}` : title]];
  r.format.fill = COLORS.navy;
  r.format.font = { bold: true, color: COLORS.white, size: 18 };
  r.format.wrapText = true;
  r.format.verticalAlignment = "center";
  r.format.rowHeight = subtitle ? 54 : 42;
}

function headerStyle(range) {
  range.format.fill = COLORS.blue;
  range.format.font = { bold: true, color: COLORS.white };
  range.format.wrapText = true;
  range.format.verticalAlignment = "center";
  range.format.borders = { preset: "outside", style: "thin", color: COLORS.line };
  range.format.rowHeight = 32;
}

function bodyStyle(range) {
  range.format.font = { color: COLORS.navy, size: 10 };
  range.format.verticalAlignment = "top";
  range.format.wrapText = true;
  range.format.borders = { insideHorizontal: { style: "thin", color: "#E2E8F0" } };
}

function addStatusControl(range) {
  range.dataValidation = { rule: { type: "list", values: statuses } };
  range.conditionalFormats.deleteAll();
  range.conditionalFormats.add("containsText", { text: "เสร็จแล้ว", format: { fill: COLORS.green, font: { bold: true, color: COLORS.greenText } } });
  range.conditionalFormats.add("containsText", { text: "กำลังพัฒนา", format: { fill: COLORS.amber, font: { bold: true, color: COLORS.amberText } } });
  range.conditionalFormats.add("containsText", { text: "ยังไม่เริ่ม", format: { fill: COLORS.gray, font: { bold: true, color: COLORS.grayText } } });
  range.conditionalFormats.add("containsText", { text: "มีปัญหา", format: { fill: COLORS.red, font: { bold: true, color: COLORS.redText } } });
  range.format.horizontalAlignment = "center";
  range.format.verticalAlignment = "center";
}

function addResultControl(range) {
  range.dataValidation = { rule: { type: "list", values: ["ผ่าน", "ไม่ผ่าน", "ยังไม่ได้ทดสอบ"] } };
  range.conditionalFormats.deleteAll();
  range.conditionalFormats.add("containsText", { text: "ผ่าน", format: { fill: COLORS.green, font: { bold: true, color: COLORS.greenText } } });
  range.conditionalFormats.add("containsText", { text: "ไม่ผ่าน", format: { fill: COLORS.red, font: { bold: true, color: COLORS.redText } } });
  range.conditionalFormats.add("containsText", { text: "ยังไม่ได้ทดสอบ", format: { fill: COLORS.gray, font: { bold: true, color: COLORS.grayText } } });
  range.format.horizontalAlignment = "center";
}

for (const sheet of [dashboard, progress, tests, risks, sdlc, architecture, settings]) {
  sheet.showGridLines = false;
}

// Settings / legend
titleBand(settings, "A1:D1", "ตัวเลือกและคำอธิบายสี", "แก้ไขสถานะในชีตงานผ่านเมนู Dropdown");
settings.getRange("A3:D3").values = [["สถานะ", "ความหมาย", "สี", "คำแนะนำ"]];
headerStyle(settings.getRange("A3:D3"));
settings.getRange("A4:D7").values = [
  ["เสร็จแล้ว", "พัฒนาและทดสอบเบื้องต้นแล้ว", "เขียว", "แนบหลักฐานและล็อกขอบเขต"],
  ["กำลังพัฒนา", "มีโค้ดหรือหน้าจอบางส่วนแล้ว", "เหลือง", "ระบุงานถัดไปและเจ้าของ"],
  ["ยังไม่เริ่ม", "อยู่ในแผนแต่ยังไม่มีหลักฐาน", "เทา", "กำหนดวันเริ่มและผู้รับผิดชอบ"],
  ["มีปัญหา", "ติดข้อจำกัดทางเทคนิค ข้อมูล หรือความปลอดภัย", "แดง", "แก้ความเสี่ยงก่อนส่งมอบ"]
];
bodyStyle(settings.getRange("A4:D7"));
addStatusControl(settings.getRange("A4:A7"));
settings.getRange("A:A").format.columnWidth = 18;
settings.getRange("B:B").format.columnWidth = 34;
settings.getRange("C:C").format.columnWidth = 12;
settings.getRange("D:D").format.columnWidth = 38;
settings.freezePanes.freezeRows(3);

// Project progress
titleBand(progress, "A1:I1", "สรุปความก้าวหน้า AI Study Companion", "ประเมินจากโค้ด การรันระบบ และผลทดสอบเบื้องต้น ณ 23 ส.ค. 2026");
progress.getRange("A3:I3").values = [["ID", "หมวด", "ฟังก์ชัน", "สถานะ", "ความก้าวหน้า", "หลักฐาน / หมายเหตุ", "ผู้รับผิดชอบ", "งานถัดไป", "เป้าหมายเสร็จ"]];
headerStyle(progress.getRange("A3:I3"));
const progressRows = [
  [1,"Core","สมัครสมาชิก / เข้าสู่ระบบ","กำลังพัฒนา",0.75,"มี bcrypt, session, lockout; แต่ยังมีบัญชี admin/admin แบบ hardcode","ยังไม่ระบุ","ลบบัญชี hardcode และเพิ่ม automated auth tests",null],
  [2,"Core","Dashboard","เสร็จแล้ว",0.90,"มีจัดการเอกสาร ตัวเลือกโมเดล และเครื่องมือเรียนรู้","ยังไม่ระบุ","เก็บ UX feedback และเพิ่ม empty/error states",null],
  [3,"File Security","Upload / PDF Extraction","กำลังพัฒนา",0.75,"ตรวจนามสกุล MIME magic bytes จำกัด 10MB เปลี่ยนชื่อ UUID และเก็บนอก public; ไฟล์เกินขนาดตอบ 500","ยังไม่ระบุ","บังคับ body limit ก่อน parse และตอบ 413",null],
  [4,"AI","AI Chat Streaming","กำลังพัฒนา",0.80,"Streaming ใช้งานได้; provider บางรายติด quota/credits ภายนอก","ยังไม่ระบุ","เพิ่ม fallback, timeout และ cost guard",null],
  [5,"Learning Tools","Summary / Quiz / Flashcard / Schedule","เสร็จแล้ว",0.85,"AI อ่านเอกสารแล้วสร้างสรุป โจทย์ Flashcard และ Schedule ได้","ยังไม่ระบุ","เพิ่มคุณภาพผลลัพธ์และ regression tests",null],
  [6,"Data Lifecycle","Document Management","กำลังพัฒนา",0.55,"ลบรายการใน DB ได้ แต่ไฟล์จริงยังคงอยู่ในเครื่อง","ยังไม่ระบุ","ลบไฟล์จริงและกำหนด retention policy",null],
  [7,"Security","Logging / Rate Limiting","กำลังพัฒนา",0.55,"มี login/access log และ rate limit; แต่ X-Forwarded-For spoof bypass ได้และเก็บใน memory","ยังไม่ระบุ","ใช้ trusted proxy + Redis rate limit",null],
  [8,"Privacy","Privacy / Retention","มีปัญหา",0.25,"ยังไม่มี privacy policy; พบ uploads ถูกติดตามใน Git","ยังไม่ระบุ","ignore uploads, purge history และประกาศนโยบายลบข้อมูล",null],
  [9,"Quality","Automated Tests","ยังไม่เริ่ม",0.10,"ยังไม่มี npm test suite; มีเพียง build/lint/manual checks","ยังไม่ระบุ","เพิ่ม unit, integration และ security regression tests",null],
  [10,"Documentation","Architecture / Security Docs","กำลังพัฒนา",0.30,"มี code/schema แต่ยังขาด diagram, threat model และ risk documentation แบบเป็นทางการ","ยังไม่ระบุ","จัดทำ Architecture, Use Case, ERD, User Flow และ Threat Model",null]
];
progress.getRange("A4:I13").values = progressRows;
bodyStyle(progress.getRange("A4:I13"));
addStatusControl(progress.getRange("D4:D13"));
progress.getRange("E4:E13").format.numberFormat = "0%";
progress.getRange("E4:E13").conditionalFormats.add("dataBar", { color: COLORS.blue, gradient: true, thresholds: [0, 1] });
progress.getRange("I4:I13").format.numberFormat = "dd/mm/yyyy";
progress.getRange("A:A").format.columnWidth = 6;
progress.getRange("B:B").format.columnWidth = 18;
progress.getRange("C:C").format.columnWidth = 32;
progress.getRange("D:D").format.columnWidth = 18;
progress.getRange("E:E").format.columnWidth = 16;
progress.getRange("F:F").format.columnWidth = 58;
progress.getRange("G:G").format.columnWidth = 18;
progress.getRange("H:H").format.columnWidth = 48;
progress.getRange("I:I").format.columnWidth = 16;
progress.getRange("A4:A13").format.horizontalAlignment = "center";
progress.freezePanes.freezeRows(3);
progress.tables.add("A3:I13", true, "ProjectProgressTable").style = "TableStyleMedium2";

// Security tests
titleBand(tests, "A1:G1", "ผลการทดสอบความปลอดภัยเบื้องต้น", "ผลลัพธ์สีเขียว = ผ่าน สีแดง = ไม่ผ่าน สีเทา = ยังไม่ได้ทดสอบ");
tests.getRange("A3:G3").values = [["ID", "Test Case", "ผลที่คาดหวัง", "ผลจริง", "ผลการทดสอบ", "ความรุนแรง", "หลักฐาน / หมายเหตุ"]];
headerStyle(tests.getRange("A3:G3"));
tests.getRange("A4:G13").values = [
  [1,"อัปโหลด PDF ที่ถูกต้อง","ระบบรับไฟล์","201 Created","ผ่าน","ต่ำ","Manual test"],
  [2,"อัปโหลดไฟล์ .exe","ระบบปฏิเสธ","400 Bad Request","ผ่าน","สูง","ตรวจ extension/MIME"],
  [3,"ปลอมไฟล์ .exe เป็น .pdf","ระบบตรวจ signature และปฏิเสธ","400 fake signature","ผ่าน","สูง","Magic bytes validation"],
  [4,"อัปโหลดไฟล์มากกว่า 10MB","ระบบปฏิเสธด้วย 413","500 Internal Server Error","ไม่ผ่าน","สูง","ต้องจำกัด request body ก่อน multipart parse"],
  [5,"ไม่ login แล้วเรียก /api/files","ตอบ 401","401 Unauthorized","ผ่าน","สูง","Manual test"],
  [6,"ไม่ login แล้วเปิด /dashboard","redirect ไป login","307 redirect","ผ่าน","กลาง","Proxy guard"],
  [7,"ใส่ ' OR 1=1 -- ใน Login","ไม่สามารถ Login ได้","401 Unauthorized","ผ่าน","สูง","Prisma/credential validation"],
  [8,"กรอกรหัสผ่านผิดเกิน limit","คำขอถูกจำกัด","ครั้งที่ 11 ได้ 429","ผ่าน","สูง","แต่ bypass ด้วย spoofed IP ได้"],
  [9,"เปลี่ยน X-Forwarded-For หลังถูก limit","ยังต้องถูกจำกัด","เปลี่ยนค่าแล้วได้ 200","ไม่ผ่าน","สูง","Rate limit bypass"],
  [10,"Admin ใช้ path traversal อ่าน package.json","ต้องปฏิเสธ","200 และอ่านไฟล์ได้","ไม่ผ่าน","วิกฤต","/api/files/..%2Fpackage.json" ]
];
bodyStyle(tests.getRange("A4:G13"));
addResultControl(tests.getRange("E4:E13"));
tests.getRange("F4:F13").dataValidation = { rule: { type: "list", values: ["ต่ำ", "กลาง", "สูง", "วิกฤต"] } };
tests.getRange("A:A").format.columnWidth = 6;
tests.getRange("B:B").format.columnWidth = 42;
tests.getRange("C:C").format.columnWidth = 38;
tests.getRange("D:D").format.columnWidth = 34;
tests.getRange("E:E").format.columnWidth = 18;
tests.getRange("F:F").format.columnWidth = 14;
tests.getRange("G:G").format.columnWidth = 48;
tests.freezePanes.freezeRows(3);
tests.tables.add("A3:G13", true, "SecurityTestsTable").style = "TableStyleMedium2";

// Risk register
titleBand(risks, "A1:J1", "Threat Model & Risk Register", "คะแนนความเสี่ยง = Likelihood × Impact (1–5)");
risks.getRange("A3:J3").values = [["ID", "Asset / Function", "Threat", "ช่องโหว่", "Likelihood", "Impact", "Risk Score", "ระดับ", "สถานะ", "วิธีป้องกัน / งานแก้ไข"]];
headerStyle(risks.getRange("A3:J3"));
risks.getRange("A4:J11").values = [
  [1,"Login","Account takeover","มีบัญชี admin/admin แบบ hardcode",5,5,null,null,"มีปัญหา","ลบบัญชี hardcode, seed แบบสุ่ม, rotate credentials"],
  [2,"File API","Path traversal","นำ filename ไป resolve โดยไม่บังคับ UUID/ขอบเขต path",5,5,null,null,"มีปัญหา","validate UUID และตรวจ resolved path อยู่ใต้ upload root"],
  [3,"Uploaded documents","Privacy leak","ไฟล์ผู้ใช้ถูกติดตามใน Git",4,5,null,null,"มีปัญหา","เพิ่ม /uploads ใน .gitignore และ purge Git history"],
  [4,"Delete document","Retention violation","ลบ DB แต่ไม่ลบ physical file",4,4,null,null,"กำลังพัฒนา","ลบไฟล์แบบ atomic และกำหนด retention/deletion policy"],
  [5,"Rate limiting","Abuse / cost exhaustion","เชื่อ X-Forwarded-For และเก็บ counter ใน memory",4,4,null,null,"กำลังพัฒนา","trusted proxy, Redis limiter, per-user/provider budget"],
  [6,"Upload","Denial of service","parse multipart ก่อน reject ขนาด",3,4,null,null,"กำลังพัฒนา","body size limit, streaming parser, ตอบ 413"],
  [7,"AI prompt","Prompt injection","เอกสาร/คำถามอาจสั่ง AI ข้ามข้อกำหนด",3,4,null,null,"กำลังพัฒนา","แยก system/data, limit tools, grounding และ output validation"],
  [8,"Frontend dependencies","XSS / known CVE","Mermaid securityLevel loose และ dependency audit มีช่องโหว่",3,4,null,null,"มีปัญหา","ใช้ strict/sanitize และอัปเดต dependencies"]
];
risks.getRange("G4").formulas = [["=E4*F4"]];
risks.getRange("G4:G11").fillDown();
risks.getRange("H4").formulas = [["=IF(G4>=20,\"วิกฤต\",IF(G4>=12,\"สูง\",IF(G4>=6,\"กลาง\",\"ต่ำ\")))"]];
risks.getRange("H4:H11").fillDown();
bodyStyle(risks.getRange("A4:J11"));
addStatusControl(risks.getRange("I4:I11"));
risks.getRange("E4:F11").dataValidation = { rule: { type: "whole", operator: "between", formula1: 1, formula2: 5 } };
risks.getRange("G4:G11").conditionalFormats.add("colorScale", { colors: [COLORS.green, COLORS.amber, COLORS.red], thresholds: ["min", "50%", "max"] });
risks.getRange("A:A").format.columnWidth = 6;
risks.getRange("B:B").format.columnWidth = 24;
risks.getRange("C:C").format.columnWidth = 24;
risks.getRange("D:D").format.columnWidth = 44;
risks.getRange("E:F").format.columnWidth = 12;
risks.getRange("G:H").format.columnWidth = 14;
risks.getRange("I:I").format.columnWidth = 18;
risks.getRange("J:J").format.columnWidth = 52;
risks.freezePanes.freezeRows(3);
risks.tables.add("A3:J11", true, "RiskRegisterTable").style = "TableStyleMedium2";

// Secure SDLC
titleBand(sdlc, "A1:F1", "Secure SDLC Coverage", "สรุปหลักฐานที่มีและสิ่งที่ยังต้องทำก่อนส่งงาน");
sdlc.getRange("A3:F3").values = [["ขั้นตอน", "สถานะ", "ความก้าวหน้า", "หลักฐานที่มี", "ช่องว่าง", "งานถัดไป"]];
headerStyle(sdlc.getRange("A3:F3"));
sdlc.getRange("A4:F9").values = [
  ["Requirement","กำลังพัฒนา",0.40,"ข้อกำหนดฟังก์ชันอนุมานได้จากระบบ","ไม่มี Security/Privacy requirement แบบเป็นทางการ","เขียน security requirements และ acceptance criteria"],
  ["Design","กำลังพัฒนา",0.45,"มี auth, ownership และ RBAC บางส่วน","ขาด trust boundary, threat model และ diagram","ทำ architecture/use case/ERD/user flow + STRIDE"],
  ["Development","กำลังพัฒนา",0.65,"bcrypt, Prisma, .env, upload validation","hardcoded admin, traversal, rate limit bypass","แก้ critical/high findings และ code review"],
  ["Testing","กำลังพัฒนา",0.35,"มี build/lint/manual security tests","ไม่มี automated security tests","เพิ่ม unit/integration/regression และ dependency scanning"],
  ["Deployment","กำลังพัฒนา",0.55,"Docker, non-root, env และ security headers บางส่วน","weak default secrets และเปิด DB/Redis ports","harden compose, secret management, HTTPS"],
  ["Maintenance","ยังไม่เริ่ม",0.20,"มี login/access logs","ไม่มี monitoring, alert, patch/incident process","กำหนด log retention, alerts, patch cadence, IR playbook"]
];
bodyStyle(sdlc.getRange("A4:F9"));
addStatusControl(sdlc.getRange("B4:B9"));
sdlc.getRange("C4:C9").format.numberFormat = "0%";
sdlc.getRange("C4:C9").conditionalFormats.add("dataBar", { color: COLORS.blue, gradient: true, thresholds: [0, 1] });
sdlc.getRange("A:A").format.columnWidth = 18;
sdlc.getRange("B:B").format.columnWidth = 18;
sdlc.getRange("C:C").format.columnWidth = 16;
sdlc.getRange("D:F").format.columnWidth = 46;
sdlc.freezePanes.freezeRows(3);
sdlc.tables.add("A3:F9", true, "SecureSDLCTable").style = "TableStyleMedium2";

// Architecture, DB and API evidence
titleBand(architecture, "A1:F1", "Architecture, Database & API Evidence", "รายการหลักฐานสำหรับรายงานวิเคราะห์และออกแบบระบบ");
architecture.getRange("A3:F3").values = [["หลักฐาน", "สถานะ", "สิ่งที่มี", "สิ่งที่ขาด", "ไฟล์ / Endpoint อ้างอิง", "งานถัดไป"]];
headerStyle(architecture.getRange("A3:F3"));
architecture.getRange("A4:F11").values = [
  ["System Architecture","กำลังพัฒนา","โครงสร้าง Browser → Next.js UI/Routes → PostgreSQL/Prisma + uploads + AI APIs","ยังไม่มี diagram เป็นทางการ","src/app, src/lib, prisma/schema.prisma","วาด architecture และ trust boundary"],
  ["Use Case Diagram","ยังไม่เริ่ม","มี user flows ใน code","ไม่มี diagram","Dashboard/Auth/API routes","ทำ Actor: User/Admin/AI Provider"],
  ["ER Diagram","กำลังพัฒนา","มี Prisma schema","ไม่มี ERD image","prisma/schema.prisma","สร้าง ERD พร้อม cardinality"],
  ["ตาราง DB PK/FK","กำลังพัฒนา","มี models และ relations","ยังไม่มีตารางสรุปในรายงาน","User/Account/Session/Document/Message/LearningTool","จัดทำ data dictionary"],
  ["API Endpoint","เสร็จแล้ว","มี endpoints สำคัญและ access checks","ยังต้องจัดรูปแบบเอกสาร","/api/auth, /api/upload, /api/files, /api/ai, /api/tools","แนบตารางด้านล่างในรายงาน"],
  ["User Flow","กำลังพัฒนา","Login → Upload → Analyze → Learn tools","ไม่มี flow diagram","src/app/dashboard","วาด happy/error paths"],
  ["Wireframe / หน้าจอจริง","เสร็จแล้ว","มีหน้าจอจริง","ต้องเลือกภาพประกอบรายงาน","Dashboard/Login/Upload/Chat","capture 4–6 หน้าจอ"],
  ["Front/Back/DB/External split","เสร็จแล้ว","แยก Next.js UI, Route Handlers, Prisma/Postgres, AI Providers","ควรระบุ data flow/privacy","src/app, src/lib, prisma","เพิ่ม data-flow arrows และ secret boundary"]
];
bodyStyle(architecture.getRange("A4:F11"));
addStatusControl(architecture.getRange("B4:B11"));
architecture.getRange("A13:E13").values = [["Method", "Endpoint", "หน้าที่", "ผู้ที่เข้าถึงได้", "หมายเหตุด้านความปลอดภัย"]];
headerStyle(architecture.getRange("A13:E13"));
architecture.getRange("A14:E23").values = [
  ["POST","/api/auth/register","สมัครสมาชิก","ทุกคน","validate + bcrypt"],
  ["POST","/api/auth/callback/credentials","เข้าสู่ระบบ","ทุกคน","lockout/rate limit; ต้องลบ admin hardcode"],
  ["POST","/api/upload","อัปโหลด PDF","ผู้ใช้ที่ login","MIME/ext/magic/size/UUID"],
  ["GET","/api/files","รายการเอกสาร","ผู้ใช้ที่ login","กรองตาม user"],
  ["GET/PATCH/DELETE","/api/files/[filename]","ดู แก้ชื่อ ลบเอกสาร","เจ้าของ/Admin","ต้องแก้ path traversal และลบไฟล์จริง"],
  ["POST","/api/ai","AI chat แบบ streaming","เจ้าของเอกสาร","API key อยู่ server-side"],
  ["POST","/api/tools","สร้าง Summary/Quiz/Flashcard/Schedule","เจ้าของเอกสาร","ควรจำกัด prompt/cost"],
  ["GET","/api/messages","ดูประวัติสนทนา","ผู้ใช้ที่ login","กรองตาม user"],
  ["GET","/api/ai/providers","รายการโมเดล","ผู้ใช้ที่ login","ไม่ส่ง API key กลับ client"],
  ["POST","/api/contact","ส่งข้อความติดต่อ","ทุกคน","ควรมี anti-spam/rate limit"]
];
bodyStyle(architecture.getRange("A14:E23"));
architecture.getRange("A:A").format.columnWidth = 22;
architecture.getRange("B:B").format.columnWidth = 30;
architecture.getRange("C:C").format.columnWidth = 38;
architecture.getRange("D:D").format.columnWidth = 36;
architecture.getRange("E:E").format.columnWidth = 50;
architecture.getRange("F:F").format.columnWidth = 46;
architecture.freezePanes.freezeRows(3);

// Dashboard driven by editable status/progress sheets
titleBand(dashboard, "A1:J2", "AI Study Companion — Progress & Security Dashboard", "สถานะปัจจุบัน: ยังไม่พร้อมส่ง production | ประเด็นวิกฤตต้องแก้ก่อน");
dashboard.getRange("A4:B4").merge(); dashboard.getRange("A4:B4").values = [["ความก้าวหน้าเฉลี่ย"]];
dashboard.getRange("C4:D4").merge(); dashboard.getRange("C4:D4").values = [["เสร็จแล้ว"]];
dashboard.getRange("E4:F4").merge(); dashboard.getRange("E4:F4").values = [["กำลังพัฒนา"]];
dashboard.getRange("G4:H4").merge(); dashboard.getRange("G4:H4").values = [["มีปัญหา"]];
dashboard.getRange("I4:J4").merge(); dashboard.getRange("I4:J4").values = [["Risk วิกฤต"]];
for (const r of ["A4:B4","C4:D4","E4:F4","G4:H4","I4:J4"]) {
  dashboard.getRange(r).format.fill = COLORS.sky;
  dashboard.getRange(r).format.font = { bold: true, color: COLORS.blue };
  dashboard.getRange(r).format.horizontalAlignment = "center";
}
dashboard.getRange("A5:B6").merge(); dashboard.getRange("A5:B6").formulas = [["=AVERAGE('สถานะโครงการ'!E4:E13)"]];
dashboard.getRange("C5:D6").merge(); dashboard.getRange("C5:D6").formulas = [["=COUNTIF('สถานะโครงการ'!D4:D13,\"เสร็จแล้ว\")"]];
dashboard.getRange("E5:F6").merge(); dashboard.getRange("E5:F6").formulas = [["=COUNTIF('สถานะโครงการ'!D4:D13,\"กำลังพัฒนา\")"]];
dashboard.getRange("G5:H6").merge(); dashboard.getRange("G5:H6").formulas = [["=COUNTIF('สถานะโครงการ'!D4:D13,\"มีปัญหา\")"]];
dashboard.getRange("I5:J6").merge(); dashboard.getRange("I5:J6").formulas = [["=COUNTIF('Risk Register'!H4:H11,\"วิกฤต\")"]];
dashboard.getRange("A5:J6").format.font = { bold: true, size: 24, color: COLORS.navy };
dashboard.getRange("A5:J6").format.horizontalAlignment = "center";
dashboard.getRange("A5:J6").format.verticalAlignment = "center";
dashboard.getRange("A5:B6").format.numberFormat = "0%";
dashboard.getRange("A4:J6").format.borders = { preset: "outside", style: "thin", color: COLORS.line };

dashboard.getRange("A8:D8").merge(); dashboard.getRange("A8:D8").values = [["สถานะฟังก์ชัน"]];
dashboard.getRange("F8:J8").merge(); dashboard.getRange("F8:J8").values = [["งานเร่งด่วนก่อนส่งมอบ"]];
for (const r of ["A8:D8", "F8:J8"]) {
  dashboard.getRange(r).format.fill = COLORS.navy;
  dashboard.getRange(r).format.font = { bold: true, color: COLORS.white, size: 13 };
}
dashboard.getRange("A9:B13").values = [
  ["สถานะ","จำนวน"],
  ["เสร็จแล้ว",null],
  ["กำลังพัฒนา",null],
  ["ยังไม่เริ่ม",null],
  ["มีปัญหา",null]
];
dashboard.getRange("B10").formulas = [["=COUNTIF('สถานะโครงการ'!D4:D13,A10)"]];
dashboard.getRange("B10:B13").fillDown();
headerStyle(dashboard.getRange("A9:B9"));
bodyStyle(dashboard.getRange("A10:B13"));
addStatusControl(dashboard.getRange("A10:A13"));
dashboard.getRange("F9:J13").values = [
  ["ลำดับ","ประเด็น","ระดับ","สถานะ","หลักฐาน"],
  [1,"ลบ hardcoded admin/admin","วิกฤต","มีปัญหา","auth route"],
  [2,"ปิดช่องโหว่ path traversal","วิกฤต","มีปัญหา","files/[filename]"],
  [3,"หยุด track uploads และ purge history","วิกฤต","มีปัญหา","Git repository"],
  [4,"ลบ physical file + retention policy","สูง","กำลังพัฒนา","DELETE document"]
];
headerStyle(dashboard.getRange("F9:J9"));
bodyStyle(dashboard.getRange("F10:J13"));
addStatusControl(dashboard.getRange("I10:I13"));
const chart = dashboard.charts.add("doughnut", dashboard.getRange("A9:B13"));
chart.title = "สัดส่วนสถานะฟังก์ชัน";
chart.hasLegend = true;
chart.setPosition("A15", "E29");

dashboard.getRange("F15:J15").merge(); dashboard.getRange("F15:J15").values = [["ภาพรวมด้านความปลอดภัย"]];
dashboard.getRange("F15:J15").format.fill = COLORS.navy;
dashboard.getRange("F15:J15").format.font = { bold: true, color: COLORS.white, size: 13 };
dashboard.getRange("F16:J21").values = [
  ["หัวข้อ","ผล","รายละเอียด","เจ้าของ","เป้าหมาย"],
  ["Password hashing","ผ่าน","ใช้ bcrypt", "ยังไม่ระบุ", null],
  ["Upload validation","กำลังพัฒนา","ผ่าน ext/MIME/signature; size handling ยังผิด", "ยังไม่ระบุ", null],
  ["Authorization","มีปัญหา","พบ path traversal และ admin hardcode", "ยังไม่ระบุ", null],
  ["Privacy/Retention","มีปัญหา","Git uploads + physical file ไม่ถูกลบ", "ยังไม่ระบุ", null],
  ["Dependency audit","มีปัญหา","8 vulnerabilities: 1 critical, 4 high, 3 moderate", "ยังไม่ระบุ", null]
];
headerStyle(dashboard.getRange("F16:J16"));
bodyStyle(dashboard.getRange("F17:J21"));
dashboard.getRange("F17:F21").format.font = { bold: true, color: COLORS.navy };
dashboard.getRange("G17:G21").conditionalFormats.add("containsText", { text: "ผ่าน", format: { fill: COLORS.green, font: { bold: true, color: COLORS.greenText } } });
dashboard.getRange("G17:G21").conditionalFormats.add("containsText", { text: "กำลังพัฒนา", format: { fill: COLORS.amber, font: { bold: true, color: COLORS.amberText } } });
dashboard.getRange("G17:G21").conditionalFormats.add("containsText", { text: "มีปัญหา", format: { fill: COLORS.red, font: { bold: true, color: COLORS.redText } } });
dashboard.getRange("A:J").format.columnWidth = 15;
dashboard.getRange("F:F").format.columnWidth = 18;
dashboard.getRange("G:G").format.columnWidth = 18;
dashboard.getRange("H:H").format.columnWidth = 46;
dashboard.getRange("I:I").format.columnWidth = 18;
dashboard.getRange("J:J").format.columnWidth = 18;
dashboard.freezePanes.freezeRows(2);

// Inspect, render every sheet, and export.
const inspection = await wb.inspect({ kind: "workbook,sheet,table,drawing", maxChars: 12000, tableMaxRows: 4, tableMaxCols: 8 });
await fs.writeFile(path.join(outputDir, "inspection.txt"), inspection.ndjson ?? String(inspection), "utf8");
const formulaErrors = await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, maxChars: 8000 });
await fs.writeFile(path.join(outputDir, "formula-errors.txt"), formulaErrors.ndjson ?? String(formulaErrors), "utf8");

for (const sheet of [dashboard, progress, tests, risks, sdlc, architecture, settings]) {
  const preview = await wb.render({ sheetName: sheet.name, autoCrop: "all", scale: 0.8, format: "png" });
  const safeName = sheet.name.replace(/[\\/:*?\"<>|& ]/g, "-");
  await fs.writeFile(path.join(outputDir, `${safeName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(path.join(outputDir, "AI-Study-Companion-Progress-Security-Summary.xlsx"));
console.log(JSON.stringify({ outputDir, sheets: [dashboard, progress, tests, risks, sdlc, architecture, settings].map(s => s.name) }, null, 2));
