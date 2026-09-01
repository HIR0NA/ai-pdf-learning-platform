import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const userIdFrom = (session: unknown) => ((session as { user?: { id?: string } } | null)?.user)?.id;

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = userIdFrom(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const deleted = await prisma.quizAttempt.deleteMany({ where: { id, userId } });
  return deleted.count ? NextResponse.json({ deleted: true }) : NextResponse.json({ error: 'Quiz attempt not found' }, { status: 404 });
}
