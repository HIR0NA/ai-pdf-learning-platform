import { PrismaClient } from '@prisma/client';
import { readFile, writeFile, unlink } from 'fs/promises';
import { isSafeStoredDocumentFilename, resolveStoredDocumentPaths } from '@/lib/security';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const execAsync = util.promisify(exec);

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
  const tempId = uuidv4();
  const tempPath = path.join(os.tmpdir(), `${tempId}.pdf`);
  
  try {
    await writeFile(tempPath, buffer);
    // Use MarkItDown for much better PDF to Markdown extraction
    const { stdout } = await execAsync(`python -m markitdown "${tempPath}"`, { maxBuffer: 1024 * 1024 * 50 }); // 50MB buffer
    
    const text = normalizeExtractedText(stdout);
    if (!text) {
      throw new DocumentTextError(
        'ไม่พบข้อความใน PDF ไฟล์นี้อาจเป็นเอกสารสแกนที่ต้องใช้ OCR',
        422,
      );
    }
    return text;
  } catch (error) {
    if (error instanceof DocumentTextError) throw error;
    console.error('MarkItDown Error:', error);
    throw new DocumentTextError('ไม่สามารถอ่านข้อความจาก PDF ได้ (MarkItDown Error)', 422);
  } finally {
    try {
      await unlink(tempPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

export async function getOwnedDocumentText(
  prisma: PrismaClient,
  userId: string,
  filename: string,
) {
  if (!isSafeStoredDocumentFilename(filename)) {
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
