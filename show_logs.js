const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.loginLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Recent Login Logs:');
  console.table(logs);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
