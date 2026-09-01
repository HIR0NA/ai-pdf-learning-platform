import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const deleted = await prisma.course.deleteMany({ where: { id, userId } });
  if (deleted.count === 0) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  return NextResponse.json({ deleted: true });
}
