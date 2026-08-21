const fs = require('fs/promises');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = await fs.readdir(uploadsDir);
  
  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const stats = await fs.stat(path.join(uploadsDir, file));
      
      const exists = await prisma.document.findFirst({ where: { filename: file } });
      if (!exists) {
        await prisma.document.create({
          data: {
            title: file, // Just use filename as title for sync
            filename: file,
            url: `/api/files/${file}`,
            size: stats.size,
            mimeType: 'application/pdf',
            userId: 'admin-123'
          }
        });
        console.log(`Synced ${file} to database.`);
      }
    }
  }
}

run()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error(err);
    prisma.$disconnect();
  });
