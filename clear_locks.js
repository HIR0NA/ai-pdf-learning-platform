const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.loginLog.deleteMany({});
  await prisma.user.updateMany({
    data: { failedAttempts: 0, lockedUntil: null }
  });
  console.log('Logs and lockouts cleared!');
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
