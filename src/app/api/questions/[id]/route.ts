import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const userIdFrom = (session: unknown) => ((session as { user?: { id?: string } } | null)?.user)?.id;

type Payload = { prompt?: unknown; options?: unknown; answerIndex?: unknown; explanation?: unknown; courseId?: unknown };

async function parsePayload(body: Payload, userId: string) {
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const options = Array.isArray(body.options) ? body.options.map((option) => typeof option === 'string' ? option.trim() : '') : [];
  const answerIndex = typeof body.answerIndex === 'number' ? body.answerIndex : -1;
  const explanation = typeof body.explanation === 'string' ? body.explanation.trim() : '';

  if (!prompt || prompt.length > 2000 || options.length !== 4 || options.some((option) => !option || option.length > 500) || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3 || explanation.length > 4000) return null;

  let courseId: string | null = null;
  if (body.courseId) {
    if (typeof body.courseId !== 'string') return null;
    const course = await prisma.course.findFirst({ where: { id: body.courseId, userId }, select: { id: true } });
    if (!course) return null;
    courseId = course.id;
  }

  return { prompt, options: JSON.stringify(options), answerIndex, explanation: explanation || null, courseId };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = userIdFrom(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const data = await parsePayload(await request.json() as Payload, userId);
    if (!data) return NextResponse.json({ error: 'Invalid question data or course' }, { status: 400 });

    const updated = await prisma.question.updateMany({ where: { id, userId }, data });
    if (!updated.count) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    const question = await prisma.question.findUnique({ where: { id }, include: { course: { select: { id: true, title: true, code: true } } } });
    return NextResponse.json({ question: { ...question!, options: JSON.parse(question!.options) } });
  } catch {
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = userIdFrom(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const deleted = await prisma.question.deleteMany({ where: { id, userId } });
  return deleted.count ? NextResponse.json({ deleted: true }) : NextResponse.json({ error: 'Question not found' }, { status: 404 });
}
