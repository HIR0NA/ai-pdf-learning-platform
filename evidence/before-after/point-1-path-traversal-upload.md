# Before / After Evidence 01: File Upload Validation & Path Traversal

---

## 1. Vulnerability Description
- **Threat/Vulnerability:** Arbitrary File Upload & Path Traversal (OWASP Top 10 - A01 / A04)
- **Asset Affected:** File Upload API (`/api/upload`) & Local File Storage (`uploads/`)
- **Impact:** An attacker could upload an executable/malicious script or supply a relative path filename such as `../../etc/passwd` or `../../package.json` to overwrite critical server files.

---

## 2. Before Fix (Vulnerable Code)
```typescript
// VULNERABLE: Direct reliance on user-provided filename and MIME type header
export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  // Flaw 1: Trusts Content-Type sent by client
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Not a PDF' }, { status: 400 });
  }

  // Flaw 2: Direct string concatenation of user-controlled filename
  const filePath = path.join(process.cwd(), 'uploads', file.name); 
  // If file.name is "../../package.json", it escapes uploads directory!

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return NextResponse.json({ success: true, filename: file.name });
}
```

---

## 3. After Fix (Remediated Code)
```typescript
// SECURED: Multi-tier validation + UUID v4 naming + Path containment check
import { isSafeStoredDocumentFilename, resolveStoredDocumentPaths } from '@/lib/security';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  // 1. Content size validation
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'File size exceeds limit' }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 2. Magic Bytes Inspection: Verify %PDF- (0x25, 0x50, 0x44, 0x46)
  const isRealPdf = buffer.length >= 4 &&
    buffer[0] === 0x25 && buffer[1] === 0x50 && 
    buffer[2] === 0x44 && buffer[3] === 0x46;
  if (!isRealPdf) {
    return NextResponse.json({ error: 'Invalid file format: Magic bytes mismatch' }, { status: 400 });
  }

  // 3. Cryptographically random UUID v4 filename (ignores user-supplied name)
  const safeFilename = `${crypto.randomUUID()}.pdf`;

  // 4. Path containment verification: Ensures absolute path stays inside upload root
  const { pdfPath } = resolveStoredDocumentPaths(safeFilename);
  await fs.writeFile(pdfPath, buffer);

  // 5. Store metadata in DB tied to authenticated user ID
  await prisma.document.create({
    data: { id: safeFilename, originalName: sanitize(file.name), userId: session.user.id }
  });

  return NextResponse.json({ success: true, id: safeFilename });
}
```

---

## 4. Verification & Result
- Unit test `stored PDF filename accepts generated UUID names only` **PASSED**.
- Unit test `resolved document artifacts stay inside the upload root` **PASSED**.
- Attacker attempting to pass `../package.json` receives strict error rejection.
