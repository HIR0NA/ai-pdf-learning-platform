import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const outputDir = path.resolve('outputs/security-remediation-final-20260823');
await fs.mkdir(outputDir, { recursive: true });

const wb = Workbook.create();
const dashboard = wb.worksheets.add('Dashboard');
const fixes = wb.worksheets.add('สรุปการแก้ไข');
const tests = wb.worksheets.add('ผลการทดสอบ');
const controls = wb.worksheets.add('Security Controls');
const settings = wb.worksheets.add('ตั้งค่า');

const C = {
  navy: '#0F172A', blue: '#1D4ED8', white: '#FFFFFF', line: '#CBD5E1',
  green: '#DCFCE7', greenText: '#166534', amber: '#FEF3C7', amberText: '#92400E',
  gray: '#E5E7EB', grayText: '#374151', red: '#FEE2E2', redText: '#991B1B', sky: '#DBEAFE',
};
const statuses = ['เสร็จแล้ว', 'กำลังพัฒนา', 'ยังไม่เริ่ม', 'มีปัญหา'];

function title(sheet, address, text, subtitle) {
  const range = sheet.getRange(address);
  range.merge();
  range.values = [[`${text}\n${subtitle}`]];
  range.format.fill = C.navy;
  range.format.font = { bold: true, color: C.white, size: 18 };
  range.format.wrapText = true;
  range.format.rowHeight = 54;
}

function header(range) {
  range.format.fill = C.blue;
  range.format.font = { bold: true, color: C.white };
  range.format.wrapText = true;
  range.format.verticalAlignment = 'center';
  range.format.rowHeight = 32;
}

function body(range) {
  range.format.font = { color: C.navy, size: 10 };
  range.format.wrapText = true;
  range.format.verticalAlignment = 'top';
  range.format.borders = { insideHorizontal: { style: 'thin', color: '#E2E8F0' } };
}

function statusControl(range) {
  range.dataValidation = { rule: { type: 'list', values: statuses } };
  range.conditionalFormats.add('containsText', { text: 'เสร็จแล้ว', format: { fill: C.green, font: { bold: true, color: C.greenText } } });
  range.conditionalFormats.add('containsText', { text: 'กำลังพัฒนา', format: { fill: C.amber, font: { bold: true, color: C.amberText } } });
  range.conditionalFormats.add('containsText', { text: 'ยังไม่เริ่ม', format: { fill: C.gray, font: { bold: true, color: C.grayText } } });
  range.conditionalFormats.add('containsText', { text: 'มีปัญหา', format: { fill: C.red, font: { bold: true, color: C.redText } } });
  range.format.horizontalAlignment = 'center';
}

function resultControl(range) {
  range.dataValidation = { rule: { type: 'list', values: ['ผ่าน', 'ไม่ผ่าน', 'ยังไม่ได้ทดสอบ'] } };
  range.conditionalFormats.add('containsText', { text: 'ผ่าน', format: { fill: C.green, font: { bold: true, color: C.greenText } } });
  range.conditionalFormats.add('containsText', { text: 'ไม่ผ่าน', format: { fill: C.red, font: { bold: true, color: C.redText } } });
  range.conditionalFormats.add('containsText', { text: 'ยังไม่ได้ทดสอบ', format: { fill: C.gray, font: { bold: true, color: C.grayText } } });
  range.format.horizontalAlignment = 'center';
}

for (const sheet of [dashboard, fixes, tests, controls, settings]) sheet.showGridLines = false;

title(fixes, 'A1:H1', 'สรุปการแก้ไข — AI Study Companion', 'แก้ไขและตรวจสอบซ้ำ ณ 23 ส.ค. 2026');
fixes.getRange('A3:H3').values = [['ID', 'ประเด็นเดิม', 'สถานะ', 'ความก้าวหน้า', 'สิ่งที่แก้', 'หลักฐาน', 'ผลตรวจ', 'หมายเหตุ']];
header(fixes.getRange('A3:H3'));
fixes.getRange('A4:H15').values = [
  [1, 'Hardcoded admin/admin', 'เสร็จแล้ว', 1, 'ลบ auth bypass; login ผ่านบัญชี bcrypt ใน DB เท่านั้น', 'auth route + seed_admin.js', 'ผ่าน', 'Admin seed ต้องใช้รหัสผ่านจาก .env'],
  [2, 'Path traversal ใน File API', 'เสร็จแล้ว', 1, 'บังคับ UUID.pdf และตรวจ resolved path อยู่ใต้ uploads', 'src/lib/security.ts', 'ผ่าน', 'HTTP traversal = 400'],
  [3, 'ลบ DB แต่ไฟล์จริงค้าง', 'เสร็จแล้ว', 1, 'ลบ PDF, extracted text และ legacy index', 'files/[filename] DELETE', 'ผ่าน', 'ตรวจหลังลบไม่เหลือ artifact'],
  [4, 'Rate limit bypass ด้วย X-Forwarded-For', 'เสร็จแล้ว', 1, 'ใช้ user identity + Redis; trust proxy ต้องเปิดเอง', 'proxy.ts + rate-limit.ts', 'ผ่าน', 'request 11 และ spoof = 429'],
  [5, 'ไฟล์เกิน 10MB ตอบ 500', 'เสร็จแล้ว', 1, 'ตรวจ content-length/file size และตอบ 413', 'upload route + next config', 'ผ่าน', 'HTTP = 413'],
  [6, 'ไฟล์อัปโหลดถูก track ใน Git', 'เสร็จแล้ว', 1, 'เพิ่ม /uploads/ ใน .gitignore และนำออกจาก Git index', '.gitignore + git index', 'ผ่าน', 'ไฟล์จริงยังอยู่ในเครื่อง'],
  [7, 'XSS จาก Mermaid/Blog', 'เสร็จแล้ว', 1, 'Mermaid strict; blog render เป็น React text', 'MermaidViewer + blog page', 'ผ่าน', 'ไม่มี dangerouslySetInnerHTML ใน blog'],
  [8, 'Dependency vulnerabilities', 'เสร็จแล้ว', 1, 'อัปเดต Next, NextAuth, Mermaid, DOMPurify และ transitive deps', 'package.json/lock', 'ผ่าน', 'npm audit = 0'],
  [9, 'Student เปิด Admin แล้วไม่ตอบ 403', 'เสร็จแล้ว', 1, 'แก้ secure cookie decoding และตอบ 403 ตาม role', 'proxy.ts', 'ผ่าน', 'HTTP student/admin = 403'],
  [10, 'Server input validation ไม่ครบ', 'เสร็จแล้ว', 1, 'normalize email; validate email/password/name/title', 'register + file PATCH', 'ผ่าน', 'TypeScript/build ผ่าน'],
  [11, 'ขาด automated security tests', 'เสร็จแล้ว', 1, 'เพิ่ม Node tests และ HTTP integration suite', 'tests/', 'ผ่าน', 'Unit 6/6; HTTP 24/24'],
  [12, 'ขาด Architecture/Privacy/Secure SDLC docs', 'เสร็จแล้ว', 1, 'เพิ่ม architecture, ERD, flow, STRIDE, API, retention และ IR', 'docs/', 'ผ่าน', 'เอกสารพร้อมใช้ในรายงาน'],
];
body(fixes.getRange('A4:H15'));
statusControl(fixes.getRange('C4:C15'));
resultControl(fixes.getRange('G4:G15'));
fixes.getRange('D4:D15').format.numberFormat = '0%';
fixes.getRange('D4:D15').conditionalFormats.add('dataBar', { color: C.blue, gradient: true, thresholds: [0, 1] });
fixes.getRange('A:A').format.columnWidth = 6;
fixes.getRange('B:B').format.columnWidth = 36;
fixes.getRange('C:C').format.columnWidth = 18;
fixes.getRange('D:D').format.columnWidth = 16;
fixes.getRange('E:E').format.columnWidth = 52;
fixes.getRange('F:F').format.columnWidth = 32;
fixes.getRange('G:G').format.columnWidth = 14;
fixes.getRange('H:H').format.columnWidth = 42;
fixes.freezePanes.freezeRows(3);
fixes.tables.add('A3:H15', true, 'FinalFixesTable').style = 'TableStyleMedium2';

title(tests, 'A1:G1', 'ผลการทดสอบหลังแก้ไข', 'Automated + HTTP integration + build + dependency audit');
tests.getRange('A3:G3').values = [['ID', 'Test Case', 'Expected', 'Actual', 'ผล', 'หลักฐาน', 'ประเภท']];
header(tests.getRange('A3:G3'));
tests.getRange('A4:G19').values = [
  [1, 'UUID filename allowlist', 'reject traversal/invalid filename', 'ทุก payload ที่ทดสอบถูกปฏิเสธ', 'ผ่าน', 'npm test', 'Unit'],
  [2, 'Resolved path containment', 'อยู่ใต้ uploads เท่านั้น', 'ผ่านทุก artifact path', 'ผ่าน', 'npm test', 'Unit'],
  [3, 'Ignore spoofed forwarded IP', 'identity ไม่เปลี่ยนเมื่อ TRUST_PROXY=false', 'direct-client คงเดิม', 'ผ่าน', 'npm test', 'Unit'],
  [4, 'Rate limit request 11', '429', '429', 'ผ่าน', 'HTTP integration', 'HTTP'],
  [5, 'เปลี่ยน X-Forwarded-For หลังถูก limit', 'ยังได้ 429', '429', 'ผ่าน', 'HTTP integration', 'HTTP'],
  [6, 'PDF เกิน 10MB', '413', '413', 'ผ่าน', 'HTTP integration', 'HTTP'],
  [7, 'Fake PDF signature', '400', '400', 'ผ่าน', 'HTTP integration', 'HTTP'],
  [8, 'PDF ถูกต้อง', '201', '201', 'ผ่าน', 'HTTP integration', 'HTTP'],
  [9, 'Path traversal package.json', '400/404', '400', 'ผ่าน', 'HTTP integration', 'HTTP'],
  [10, 'Delete document', '200 และไฟล์จริงหาย', '200; PDF/TXT หาย', 'ผ่าน', 'HTTP integration', 'HTTP'],
  [11, 'Student เปิด /admin', '403', '403', 'ผ่าน', 'HTTP integration', 'RBAC'],
  [12, 'TypeScript', '0 errors', '0 errors', 'ผ่าน', 'npx tsc --noEmit', 'Static'],
  [13, 'Production build', 'success', 'Next.js 16.3.2 build สำเร็จ', 'ผ่าน', 'npm run build', 'Build'],
  [14, 'Prisma schema', 'valid', 'valid', 'ผ่าน', 'npx prisma validate', 'Database'],
  [15, 'Dependency audit', '0 vulnerabilities', '0 vulnerabilities', 'ผ่าน', 'npm audit', 'Supply chain'],
  [16, 'Docker image + runtime', 'image build และ app up', 'webpack image built; app/db/redis up', 'ผ่าน', 'docker compose build/up', 'Container'],
];
body(tests.getRange('A4:G19'));
resultControl(tests.getRange('E4:E19'));
tests.getRange('A:A').format.columnWidth = 6;
tests.getRange('B:B').format.columnWidth = 42;
tests.getRange('C:C').format.columnWidth = 38;
tests.getRange('D:D').format.columnWidth = 38;
tests.getRange('E:E').format.columnWidth = 14;
tests.getRange('F:F').format.columnWidth = 30;
tests.getRange('G:G').format.columnWidth = 16;
tests.freezePanes.freezeRows(3);
tests.tables.add('A3:G19', true, 'FinalTestsTable').style = 'TableStyleMedium2';

title(controls, 'A1:F1', 'Security Controls & Deliverables', 'หลักฐานสำหรับรายงานและการตรวจซ้ำ');
controls.getRange('A3:F3').values = [['Control', 'สถานะ', 'Implementation', 'หลักฐาน', 'คำสั่งตรวจ', 'ผล']];
header(controls.getRange('A3:F3'));
controls.getRange('A4:F13').values = [
  ['Password hashing', 'เสร็จแล้ว', 'bcrypt cost 12', 'auth/register + seed', 'npm test', 'ผ่าน'],
  ['Authentication/Lockout', 'เสร็จแล้ว', 'NextAuth JWT + persistent failed login logs', 'auth route', 'HTTP login/session', 'ผ่าน'],
  ['Authorization/RBAC', 'เสร็จแล้ว', 'owner check + ADMIN role', 'file routes + proxy', 'student /admin', 'ผ่าน'],
  ['Upload security', 'เสร็จแล้ว', 'extension/MIME/size/signature/UUID/private path', 'upload route', 'valid/fake/oversize', 'ผ่าน'],
  ['Deletion/Retention', 'เสร็จแล้ว', 'DB children + physical artifacts', 'DELETE route + privacy policy', 'delete integration', 'ผ่าน'],
  ['Rate limiting', 'เสร็จแล้ว', 'Redis atomic counter by user/path', 'rate-limit.ts', '11th/spoof test', 'ผ่าน'],
  ['Prompt injection baseline', 'เสร็จแล้ว', 'document delimited as untrusted data; grounded rules', 'AI/tool prompts', 'code inspection', 'ผ่าน'],
  ['Secret management', 'เสร็จแล้ว', '.env ignored; compose requires auth/admin secrets', '.gitignore/compose', 'docker compose config', 'ผ่าน'],
  ['Architecture/Threat Model', 'เสร็จแล้ว', 'Architecture, ERD, flow, STRIDE, API, IR', 'docs/SECURITY_AND_ARCHITECTURE.md', 'document review', 'ผ่าน'],
  ['Privacy policy', 'เสร็จแล้ว', 'AI disclosure, retention, deletion and logs', 'docs/PRIVACY.md', 'document review', 'ผ่าน'],
];
body(controls.getRange('A4:F13'));
statusControl(controls.getRange('B4:B13'));
resultControl(controls.getRange('F4:F13'));
controls.getRange('A:A').format.columnWidth = 30;
controls.getRange('B:B').format.columnWidth = 18;
controls.getRange('C:C').format.columnWidth = 52;
controls.getRange('D:D').format.columnWidth = 42;
controls.getRange('E:E').format.columnWidth = 30;
controls.getRange('F:F').format.columnWidth = 14;
controls.freezePanes.freezeRows(3);

title(settings, 'A1:D1', 'ตัวเลือกสถานะ', 'เปลี่ยนสถานะผ่าน Dropdown; สีจะอัปเดตอัตโนมัติ');
settings.getRange('A3:D3').values = [['สถานะ', 'ความหมาย', 'สี', 'การใช้งาน']];
header(settings.getRange('A3:D3'));
settings.getRange('A4:D7').values = [
  ['เสร็จแล้ว', 'พัฒนาและทดสอบแล้ว', 'เขียว', 'หลักฐานครบ'],
  ['กำลังพัฒนา', 'มีโค้ดบางส่วน', 'เหลือง', 'ยังมีงานถัดไป'],
  ['ยังไม่เริ่ม', 'ยังไม่มีหลักฐาน', 'เทา', 'ต้องวางแผน'],
  ['มีปัญหา', 'ติดข้อจำกัดหรือทดสอบไม่ผ่าน', 'แดง', 'ต้องแก้ก่อนส่ง'],
];
body(settings.getRange('A4:D7'));
statusControl(settings.getRange('A4:A7'));
settings.getRange('A:A').format.columnWidth = 18;
settings.getRange('B:B').format.columnWidth = 36;
settings.getRange('C:C').format.columnWidth = 12;
settings.getRange('D:D').format.columnWidth = 36;

title(dashboard, 'A1:J2', 'AI Study Companion — Final Security Dashboard', 'แก้ไขรายการไม่ผ่านครบและตรวจซ้ำด้วยหลักฐานจริง');
const cards = [
  ['A4:B4', 'รายการแก้ไข'], ['C4:D4', 'แก้สำเร็จ'], ['E4:F4', 'Automated tests'],
  ['G4:H4', 'HTTP tests'], ['I4:J4', 'Vulnerabilities'],
];
for (const [address, label] of cards) {
  dashboard.getRange(address).merge(); dashboard.getRange(address).values = [[label]];
  dashboard.getRange(address).format.fill = C.sky;
  dashboard.getRange(address).format.font = { bold: true, color: C.blue };
  dashboard.getRange(address).format.horizontalAlignment = 'center';
}
dashboard.getRange('A5:B6').merge(); dashboard.getRange('A5:B6').formulas = [["=COUNTA('สรุปการแก้ไข'!A4:A15)"]];
dashboard.getRange('C5:D6').merge(); dashboard.getRange('C5:D6').formulas = [["=COUNTIF('สรุปการแก้ไข'!C4:C15,\"เสร็จแล้ว\")"]];
dashboard.getRange('E5:F6').merge(); dashboard.getRange('E5:F6').values = [[6]];
dashboard.getRange('G5:H6').merge(); dashboard.getRange('G5:H6').values = [[24]];
dashboard.getRange('I5:J6').merge(); dashboard.getRange('I5:J6').values = [[0]];
dashboard.getRange('A5:J6').format.font = { bold: true, size: 24, color: C.navy };
dashboard.getRange('A5:J6').format.horizontalAlignment = 'center';
dashboard.getRange('A5:J6').format.verticalAlignment = 'center';
dashboard.getRange('A4:J6').format.borders = { preset: 'outside', style: 'thin', color: C.line };

dashboard.getRange('A8:J8').merge(); dashboard.getRange('A8:J8').values = [['ผลลัพธ์สำคัญ']];
dashboard.getRange('A8:J8').format.fill = C.navy;
dashboard.getRange('A8:J8').format.font = { bold: true, color: C.white, size: 13 };
dashboard.getRange('A9:J14').values = [
  ['หัวข้อ', 'ผล', 'หลักฐาน', '', '', '', '', '', 'สถานะ', 'หมายเหตุ'],
  ['Path traversal', '400', 'HTTP integration', '', '', '', '', '', 'เสร็จแล้ว', 'อ่าน package.json ไม่ได้'],
  ['Oversized PDF', '413', 'HTTP integration', '', '', '', '', '', 'เสร็จแล้ว', 'ขนาดเกินถูกปฏิเสธ'],
  ['Rate limit + spoof', '429', 'HTTP integration', '', '', '', '', '', 'เสร็จแล้ว', 'เปลี่ยน IP header แล้วยังถูก block'],
  ['Delete physical files', 'PASS', 'HTTP integration', '', '', '', '', '', 'เสร็จแล้ว', 'PDF/TXT/index ถูกลบ'],
  ['Supply-chain audit', '0 vulnerabilities', 'npm audit', '', '', '', '', '', 'เสร็จแล้ว', 'production และ development'],
];
header(dashboard.getRange('A9:J9'));
body(dashboard.getRange('A10:J14'));
statusControl(dashboard.getRange('I10:I14'));
dashboard.getRange('A:A').format.columnWidth = 24;
dashboard.getRange('B:B').format.columnWidth = 18;
dashboard.getRange('C:H').format.columnWidth = 12;
dashboard.getRange('I:I').format.columnWidth = 18;
dashboard.getRange('J:J').format.columnWidth = 42;
dashboard.freezePanes.freezeRows(2);

const formulaErrors = await wb.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options: { useRegex: true, maxResults: 100 }, maxChars: 5000 });
await fs.writeFile(path.join(outputDir, 'formula-errors.txt'), formulaErrors.ndjson ?? String(formulaErrors), 'utf8');
for (const sheet of [dashboard, fixes, tests, controls, settings]) {
  const preview = await wb.render({ sheetName: sheet.name, autoCrop: 'all', scale: 0.8, format: 'png' });
  await fs.writeFile(path.join(outputDir, `${sheet.name.replace(/[\\/:*?\"<>|& ]/g, '-')}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(path.join(outputDir, 'AI-Study-Companion-Final-Security-Summary.xlsx'));
console.log(path.join(outputDir, 'AI-Study-Companion-Final-Security-Summary.xlsx'));
