const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@1234';
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      failedAttempts: 0,
      lockedUntil: null,
    },
    create: {
      id: 'admin-123',
      email,
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });
  console.log(`Admin user seeded: ${email}`);
}

run()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
