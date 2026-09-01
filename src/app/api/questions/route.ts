import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Payload = { prompt?: unknown; options?: unknown; answerIndex?: unknown; explanation?: unknown; courseId?: unknown };
const userIdFrom = (session: unknown) => ((session as { user?: { id?: string } } | null)?.user)?.id;

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

export async function GET() {
  const userId = userIdFrom(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const questions = await prisma.question.findMany({ where: { userId }, include: { course: { select: { id: true, title: true, code: true } } }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json({ questions: questions.map((question) => ({ ...question, options: JSON.parse(question.options) })) });
}

export async function POST(request: Request) {
  const userId = userIdFrom(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = await parsePayload(await request.json() as Payload, userId);
    if (!data) return NextResponse.json({ error: 'Invalid question data or course' }, { status: 400 });
    const question = await prisma.question.create({ data: { ...data, userId }, include: { course: { select: { id: true, title: true, code: true } } } });
    return NextResponse.json({ question: { ...question, options: JSON.parse(question.options) } }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Failed to create question' }, { status: 500 }); }
}
