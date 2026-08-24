import { PrismaClient } from '@prisma/client';
import { readFile, writeFile } from 'fs/promises';
import pdfParse from 'pdf-parse';
import { isSafeStoredPdfFilename, resolveStoredDocumentPaths } from '@/lib/security';

export class DocumentTextError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'DocumentTextError';
  }
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function extractPdfText(buffer: Buffer) {
  // pdf.js bundled by pdf-parse 1.x misreads Node 22 Buffer offsets.
  // A standalone Uint8Array gives it the exact PDF byte range.
  const parsePdf = pdfParse as unknown as (
    data: Uint8Array,
  ) => Promise<{ text: string }>;
  const parsed = await parsePdf(new Uint8Array(buffer));
  const text = normalizeExtractedText(parsed.text);

  if (!text) {
    throw new DocumentTextError(
      'ไม่พบข้อความใน PDF ไฟล์นี้อาจเป็นเอกสารสแกนที่ต้องใช้ OCR',
      422,
    );
  }

  return text;
}

export async function getOwnedDocumentText(
  prisma: PrismaClient,
  userId: string,
  filename: string,
) {
  if (!isSafeStoredPdfFilename(filename)) {
    throw new DocumentTextError('ชื่อไฟล์เอกสารไม่ถูกต้อง', 400);
  }

  const document = await prisma.document.findFirst({
    where: { filename, userId },
  });

  if (!document) {
    throw new DocumentTextError('ไม่พบเอกสารหรือคุณไม่มีสิทธิ์เข้าถึงไฟล์นี้', 404);
  }

  const { pdfPath, textPath } = resolveStoredDocumentPaths(document.filename);

  try {
    const text = normalizeExtractedText(await readFile(textPath, 'utf8'));
    if (text) return { document, text };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
  }

  try {
    const text = await extractPdfText(await readFile(pdfPath));
    await writeFile(textPath, text, 'utf8');
    return { document, text };
  } catch (error) {
    if (error instanceof DocumentTextError) throw error;
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new DocumentTextError('ไม่พบไฟล์ PDF บนเซิร์ฟเวอร์', 404);
    }
    throw new DocumentTextError('ไม่สามารถอ่านข้อความจาก PDF ได้', 422);
  }
}
