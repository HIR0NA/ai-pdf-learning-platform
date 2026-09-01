import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const userIdFrom = (session: unknown) => ((session as { user?: { id?: string } } | null)?.user)?.id;

export async function GET() {
  const userId = userIdFrom(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const attempts = await prisma.quizAttempt.findMany({ where: { userId }, include: { course: { select: { id: true, title: true, code: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
  return NextResponse.json({ attempts });
}

export async function POST(request: Request) {
  const userId = userIdFrom(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json() as { score?: unknown; total?: unknown; filename?: unknown; courseId?: unknown; source?: unknown };
    const score = body.score; const total = body.total;
    const source = body.source === undefined ? 'AI' : body.source;
    if (!Number.isInteger(score) || !Number.isInteger(total) || (score as number) < 0 || (total as number) < 1 || (score as number) > (total as number) || (typeof body.filename !== 'string' && body.filename !== null && body.filename !== undefined) || (source !== 'AI' && source !== 'MANUAL')) return NextResponse.json({ error: 'Invalid quiz result' }, { status: 400 });
    let courseId: string | null = null;
    if (body.courseId) {
      if (typeof body.courseId !== 'string') return NextResponse.json({ error: 'Invalid course' }, { status: 400 });
      const course = await prisma.course.findFirst({ where: { id: body.courseId, userId }, select: { id: true } });
      if (!course) return NextResponse.json({ error: 'Invalid course' }, { status: 400 });
      courseId = course.id;
    }
    const attempt = await prisma.quizAttempt.create({ data: { source, score: score as number, total: total as number, filename: typeof body.filename === 'string' ? body.filename : null, courseId, userId }, include: { course: { select: { id: true, title: true, code: true } } } });
    return NextResponse.json({ attempt }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Failed to save quiz result' }, { status: 500 }); }
}
