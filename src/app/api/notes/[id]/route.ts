import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_TITLE_LENGTH = 160;
const MAX_CONTENT_LENGTH = 20_000;

function getUserId(session: unknown) {
  return ((session as { user?: { id?: string } } | null)?.user)?.id;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json() as { title?: unknown; content?: unknown; courseId?: unknown };
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!title || !content || title.length > MAX_TITLE_LENGTH || content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: 'Invalid note data' }, { status: 400 });
    }

    let courseId: string | null = null;
    if (body.courseId) {
      if (typeof body.courseId !== 'string') return NextResponse.json({ error: 'Invalid course' }, { status: 400 });
      const course = await prisma.course.findFirst({ where: { id: body.courseId, userId }, select: { id: true } });
      if (!course) return NextResponse.json({ error: 'Invalid course' }, { status: 400 });
      courseId = course.id;
    }

    const updated = await prisma.studyNote.updateMany({ where: { id, userId }, data: { title, content, courseId } });
    if (updated.count === 0) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    const note = await prisma.studyNote.findFirst({
      where: { id, userId },
      include: { course: { select: { id: true, title: true, code: true } } },
    });
    return NextResponse.json({ note });
  } catch {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const deleted = await prisma.studyNote.deleteMany({ where: { id, userId } });
  if (deleted.count === 0) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
