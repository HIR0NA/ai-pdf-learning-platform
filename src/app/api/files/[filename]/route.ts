import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import { isSafeStoredPdfFilename, resolveStoredDocumentPaths } from '@/lib/security';

const prisma = new PrismaClient();

function sessionIdentity(session: { user?: unknown } | null) {
  const user = session?.user as { id?: string; role?: string } | undefined;
  return { userId: user?.id, isAdmin: user?.role === 'ADMIN' };
}

async function findAuthorizedDocument(filename: string, userId: string, isAdmin: boolean) {
  return prisma.document.findFirst({
    where: isAdmin ? { filename } : { filename, userId },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { filename } = await params;

    if (!isSafeStoredPdfFilename(filename)) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    const { userId, isAdmin } = sessionIdentity(session);
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const doc = await findAuthorizedDocument(filename, userId, isAdmin);
    if (!doc) {
      return new NextResponse('Not Found or Unauthorized', { status: 404 });
    }

    const { pdfPath } = resolveStoredDocumentPaths(filename);
    
    try {
      const fileBuffer = await fs.readFile(pdfPath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    } catch (e) {
      return new NextResponse('File not found on disk', { status: 404 });
    }

  } catch (error) {
    console.error('Error fetching file:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = await params;
    const { userId, isAdmin } = sessionIdentity(session);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSafeStoredPdfFilename(filename)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const doc = await findAuthorizedDocument(filename, userId, isAdmin);
    if (!doc) {
      return NextResponse.json({ error: 'Not Found or Unauthorized' }, { status: 404 });
    }

    const { pdfPath, textPath, indexPath } = resolveStoredDocumentPaths(filename);

    await prisma.$transaction([
      prisma.message.deleteMany({ where: { filename, userId: doc.userId } }),
      prisma.learningTool.deleteMany({ where: { filename, userId: doc.userId } }),
      prisma.document.delete({ where: { id: doc.id } }),
    ]);

    const cleanupResults = await Promise.allSettled([
      fs.unlink(pdfPath),
      fs.unlink(textPath),
      fs.unlink(indexPath),
    ]);
    for (const result of cleanupResults) {
      if (result.status === 'rejected' && (result.reason as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Failed to remove a stored document artifact:', result.reason);
      }
    }

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = await params;
    const { userId, isAdmin } = sessionIdentity(session);
    const body = await req.json();
    const { title } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSafeStoredPdfFilename(filename)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    if (typeof title !== 'string' || !title.trim() || title.trim().length > 255) {
      return NextResponse.json({ error: 'Filename and title are required' }, { status: 400 });
    }

    const doc = await findAuthorizedDocument(filename, userId, isAdmin);
    if (!doc) {
      return NextResponse.json({ error: 'Not Found or Unauthorized' }, { status: 404 });
    }

    const normalizedTitle = title.trim();
    await prisma.document.update({
      where: { id: doc.id },
      data: { title: normalizedTitle }
    });

    return NextResponse.json({ message: 'Renamed successfully', title: normalizedTitle });
  } catch (error) {
    console.error('Error renaming file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
