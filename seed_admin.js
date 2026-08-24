const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address');
  }
  if (!password || password.length < 12 || password.length > 128) {
    throw new Error('ADMIN_PASSWORD must be set and contain 12-128 characters');
  }

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
