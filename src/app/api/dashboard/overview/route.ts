import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const userIdFrom = (session: unknown) => ((session as { user?: { id?: string } } | null)?.user)?.id;

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  const userId = userIdFrom(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [documentCount, messageCount, attempts, totalStudy, recentDocuments, recentMessages] = await Promise.all([
    prisma.document.count({ where: { userId } }),
    prisma.message.count({ where: { userId } }),
    prisma.quizAttempt.findMany({ where: { userId }, select: { score: true, total: true } }),
    prisma.studySession.aggregate({ where: { userId }, _sum: { durationSeconds: true } }),
    prisma.document.findMany({ where: { userId, createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true } }),
    prisma.message.findMany({ where: { userId, createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true } }),
  ]);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + index);
    return { key: dayKey(date), name: new Intl.DateTimeFormat('th-TH', { weekday: 'short' }).format(date), queries: 0, documents: 0 };
  });
  const indexByDay = new Map(days.map((day, index) => [day.key, index]));
  for (const item of recentDocuments) {
    const index = indexByDay.get(dayKey(item.createdAt));
    if (index !== undefined) days[index].documents += 1;
  }
  for (const item of recentMessages) {
    const index = indexByDay.get(dayKey(item.createdAt));
    if (index !== undefined) days[index].queries += 1;
  }

  const quizAverage = attempts.length
    ? Math.round((attempts.reduce((sum, attempt) => sum + attempt.score / attempt.total, 0) / attempts.length) * 100)
    : null;
  const documents = await prisma.document.findMany({
    where: { userId }, orderBy: { createdAt: 'desc' }, take: 8,
    select: { id: true, title: true, size: true, createdAt: true, course: { select: { title: true, code: true } } },
  });

  return NextResponse.json({
    stats: { documentCount, messageCount, quizAverage, quizAttempts: attempts.length, studySeconds: totalStudy._sum.durationSeconds ?? 0 },
    usage: days,
    documents,
  });
}
