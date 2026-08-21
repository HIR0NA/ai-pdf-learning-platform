const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lastMsg = await prisma.message.findFirst({
    where: { role: 'ai' },
    orderBy: { createdAt: 'desc' }
  });
  console.log(lastMsg?.content);
}
main().catch(console.error).finally(() => prisma.$disconnect());
