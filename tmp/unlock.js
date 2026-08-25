const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const u = await p.user.update({
        where: { email: 'admin@example.com' },
        data: { failedAttempts: 0, lockedUntil: null }
    });
    console.log('Unlocked:', u.email, 'failedAttempts:', u.failedAttempts);

    // Also clear recent failed login logs so the 15-min window resets
    const deleted = await p.loginLog.deleteMany({
        where: { email: 'admin@example.com', success: false }
    });
    console.log('Cleared', deleted.count, 'failed login logs');
}

main().catch(console.error).finally(() => p.$disconnect());
