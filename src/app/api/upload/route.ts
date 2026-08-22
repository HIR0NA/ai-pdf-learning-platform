import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { DocumentTextError, extractPdfText } from '@/lib/document-text';

const prisma = new PrismaClient();
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPE = 'application/pdf';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    if (file.type !== ALLOWED_MIME_TYPE || !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF is allowed.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Security: Check Magic Bytes to ensure it is actually a PDF file (%PDF)
    // 0x25 = %, 0x50 = P, 0x44 = D, 0x46 = F
    if (buffer.length < 4 || buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
      return NextResponse.json({ error: 'Security alert: Invalid file signature. Fake PDF detected.' }, { status: 400 });
    }

    let extractedText: string;
    try {
      extractedText = await extractPdfText(buffer);
    } catch (error) {
      if (error instanceof DocumentTextError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error('PDF extraction failed:', error);
      return NextResponse.json({ error: 'ไม่สามารถอ่านข้อความจาก PDF ได้' }, { status: 422 });
    }

    const fileName = `${uuidv4()}.pdf`;
    const uploadDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    const textPath = path.join(uploadDir, `${fileName}.txt`);
    await writeFile(filePath, buffer);
    await writeFile(textPath, extractedText, 'utf8');

    try {
      await prisma.document.create({
        data: {
          title: file.name,
          filename: fileName,
          url: `/api/files/${fileName}`,
          size: file.size,
          mimeType: file.type,
          userId: (session.user as { id: string }).id,
        }
      });
    } catch (error) {
      await Promise.allSettled([unlink(filePath), unlink(textPath)]);
      console.error('Failed to save document:', error);
      return NextResponse.json({ error: 'ไม่สามารถบันทึกข้อมูลเอกสารได้' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'File uploaded and text extracted successfully',
      filename: fileName,
      textLength: extractedText.length,
    }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
