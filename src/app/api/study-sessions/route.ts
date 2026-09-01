import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const userIdFrom = (session: unknown) => ((session as { user?: { id?: string } } | null)?.user)?.id;

export async function POST(request: Request) {
  const userId = userIdFrom(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as { filename?: unknown; courseId?: unknown; durationSeconds?: unknown };
    const durationSeconds = body.durationSeconds;
    if (!Number.isInteger(durationSeconds) || (durationSeconds as number) < 5 || (durationSeconds as number) > 4 * 60 * 60) {
      return NextResponse.json({ error: 'Invalid study duration' }, { status: 400 });
    }

    const filename = typeof body.filename === 'string' ? body.filename : null;
    const courseId = typeof body.courseId === 'string' ? body.courseId : null;
    if (filename) {
      const document = await prisma.document.findFirst({ where: { filename, userId }, select: { courseId: true } });
      if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      await prisma.studySession.create({ data: { durationSeconds: durationSeconds as number, filename, courseId: document.courseId, userId } });
    } else if (courseId) {
      const course = await prisma.course.findFirst({ where: { id: courseId, userId }, select: { id: true } });
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      await prisma.studySession.create({ data: { durationSeconds: durationSeconds as number, courseId, userId } });
    } else {
      return NextResponse.json({ error: 'Document or course is required' }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to record study session' }, { status: 500 });
  }
}
