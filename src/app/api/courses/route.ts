import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_TITLE_LENGTH = 120;
const MAX_CODE_LENGTH = 32;

function getUserId(session: unknown) {
  return ((session as { user?: { id?: string } } | null)?.user)?.id;
}

export async function GET() {
  const userId = getUserId(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const courses = await prisma.course.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }],
    include: { _count: { select: { documents: true, notes: true, questions: true, quizAttempts: true } } },
  });
  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  const userId = getUserId(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as { title?: unknown; code?: unknown };
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';

    if (!title || title.length > MAX_TITLE_LENGTH || code.length > MAX_CODE_LENGTH) {
      return NextResponse.json({ error: 'Invalid course title or code' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: { title, code: code || null, userId },
    });
    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Course code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
