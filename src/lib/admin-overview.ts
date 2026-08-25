import { prisma } from '@/lib/prisma';

export async function getAdminOverview() {
  const [userCount, users, documentCount, messageCount, learningToolCount, failedLoginCount, lockedUserCount, loginLogs] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { documents: true, messages: true, tools: true } },
      },
    }),
    prisma.document.count(),
    prisma.message.count(),
    prisma.learningTool.count(),
    prisma.loginLog.count({ where: { success: false } }),
    prisma.user.count({ where: { lockedUntil: { gt: new Date() } } }),
    prisma.loginLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        email: true,
        ipAddress: true,
        success: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    counts: {
      users: userCount,
      documents: documentCount,
      messages: messageCount,
      learningTools: learningToolCount,
      failedLogins: failedLoginCount,
      lockedUsers: lockedUserCount,
    },
    users,
    loginLogs,
  };
}
