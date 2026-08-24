import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId'); // Actually we'll pass filename

    if (!documentId) {
      return NextResponse.json({ error: 'documentId (filename) is required' }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        filename: documentId,
        userId: (session.user as any).id
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Messages API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
