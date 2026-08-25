const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  const accounts = [
    { prefix: 'ADMIN', name: 'Administrator', role: 'ADMIN' },
    { prefix: 'STUDENT', name: 'Demo Student', role: 'STUDENT' },
  ];

  const credentials = accounts.map((account) => {
    const email = process.env[`${account.prefix}_EMAIL`]?.trim().toLowerCase();
    const password = process.env[`${account.prefix}_PASSWORD`];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`${account.prefix}_EMAIL must be a valid email address`);
    }
    if (!password || password.length < 12 || password.length > 128) {
      throw new Error(`${account.prefix}_PASSWORD must contain 12-128 characters`);
    }
    return { ...account, email, password };
  });

  if (credentials[0].email === credentials[1].email) {
    throw new Error('ADMIN_EMAIL and STUDENT_EMAIL must be different');
  }

  for (const account of credentials) {
    const hashedPassword = await bcrypt.hash(account.password, 12);
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        password: hashedPassword,
        role: account.role,
        failedAttempts: 0,
        lockedUntil: null,
      },
      create: {
        email: account.email,
        name: account.name,
        password: hashedPassword,
        role: account.role,
      },
    });
    console.log(`${account.role} user seeded: ${account.email}`);
  }
}

run()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
