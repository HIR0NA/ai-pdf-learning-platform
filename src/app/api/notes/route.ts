import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_TITLE_LENGTH = 160;
const MAX_CONTENT_LENGTH = 20_000;

function getUserId(session: unknown) {
  return ((session as { user?: { id?: string } } | null)?.user)?.id;
}

async function getOwnedCourseId(value: unknown, userId: string) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const course = await prisma.course.findFirst({ where: { id: value, userId }, select: { id: true } });
  return course?.id;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notes = await prisma.studyNote.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true, code: true } } },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, courseId } = body as { title?: unknown; content?: unknown; courseId?: unknown };
    const normalizedTitle = typeof title === 'string' ? title.trim() : '';
    const normalizedContent = typeof content === 'string' ? content.trim() : '';
    const ownedCourseId = await getOwnedCourseId(courseId, userId);

    if (!normalizedTitle || !normalizedContent || normalizedTitle.length > MAX_TITLE_LENGTH || normalizedContent.length > MAX_CONTENT_LENGTH || ownedCourseId === undefined) {
      return NextResponse.json({ error: 'Invalid note data or course' }, { status: 400 });
    }

    const note = await prisma.studyNote.create({
      data: {
        title: normalizedTitle,
        content: normalizedContent,
        userId,
        courseId: ownedCourseId,
      },
      include: { course: { select: { id: true, title: true, code: true } } },
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
