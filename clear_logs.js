const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearLogs() {
  const result = await prisma.loginLog.deleteMany({});
  console.log(`Cleared ${result.count} logs from the database.`);
}

clearLogs().catch(console.error).finally(() => prisma.$disconnect());
