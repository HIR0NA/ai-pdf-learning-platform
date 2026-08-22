import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { filename } = await params;

    // Check if the user owns this file (or is admin)
    const userId = (session.user as any).id;
    if (userId !== 'admin-123') {
      const doc = await prisma.document.findFirst({
        where: { filename, userId }
      });
      
      if (!doc) {
        return new NextResponse('Not Found or Unauthorized', { status: 404 });
      }
    }

    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      
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
    const userId = (session.user as any).id;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Verify ownership (or admin)
    if (userId !== 'admin-123') {
      const doc = await prisma.document.findFirst({
        where: { filename, userId }
      });
      if (!doc) {
        return NextResponse.json({ error: 'Not Found or Unauthorized' }, { status: 404 });
      }
    }

    // Delete Document record
    await prisma.document.deleteMany({
      where: { filename, userId }
    });

    // Delete associated Messages
    await prisma.message.deleteMany({
      where: { filename, userId }
    });

    // Delete generated summaries and study tools for this document.
    await prisma.learningTool.deleteMany({
      where: { filename, userId }
    });

    // Per user request: DO NOT delete physical files from the machine

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
    const userId = (session.user as any).id;
    const body = await req.json();
    const { title } = body;

    if (!filename || !title) {
      return NextResponse.json({ error: 'Filename and title are required' }, { status: 400 });
    }

    // Verify ownership
    if (userId !== 'admin-123') {
      const doc = await prisma.document.findFirst({
        where: { filename, userId }
      });
      if (!doc) {
        return NextResponse.json({ error: 'Not Found or Unauthorized' }, { status: 404 });
      }
    }

    await prisma.document.updateMany({
      where: { filename, userId: userId !== 'admin-123' ? userId : undefined },
      data: { title }
    });

    return NextResponse.json({ message: 'Renamed successfully', title });
  } catch (error) {
    console.error('Error renaming file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
