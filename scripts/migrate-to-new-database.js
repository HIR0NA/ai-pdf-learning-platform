/*
 * Copies all application data from DATABASE_URL to NEW_DATABASE_URL.
 * The destination must be empty; this guard prevents accidental overwrites.
 */
const { PrismaClient } = require('@prisma/client');

const models = [
  'product',
  'post',
  'contactMessage',
  'loginLog',
  'user',
  'verificationToken',
  'account',
  'session',
  'document',
  'message',
  'learningTool',
  'studyNote',
];

const chunk = (items, size = 100) => {
  const groups = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
};

const isMissingTable = (error) => error && error.code === 'P2021';

async function countModel(client, model) {
  try {
    return { count: await client[model].count(), skipped: false };
  } catch (error) {
    if (isMissingTable(error)) return { count: 0, skipped: true };
    throw error;
  }
}

async function main() {
  const sourceUrl = process.env.DATABASE_URL;
  const targetUrl = process.env.NEW_DATABASE_URL;

  if (!sourceUrl || !targetUrl) {
    throw new Error('Both DATABASE_URL (source) and NEW_DATABASE_URL (destination) are required.');
  }
  if (sourceUrl === targetUrl) {
    throw new Error('DATABASE_URL and NEW_DATABASE_URL must point to different databases.');
  }

  const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
  const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });

  try {
    const destinationState = await Promise.all(models.map(async (model) => [model, await countModel(target, model)]));
    const populated = destinationState.filter(([, result]) => result.count > 0);
    if (populated.length > 0) {
      throw new Error(`Destination is not empty: ${populated.map(([model, result]) => `${model}=${result.count}`).join(', ')}`);
    }

    const summary = [];
    for (const model of models) {
      let records;
      try {
        records = await source[model].findMany();
      } catch (error) {
        if (isMissingTable(error)) {
          summary.push({ model, source: 0, destination: 0, status: 'skipped (source table does not exist)' });
          continue;
        }
        throw error;
      }

      for (const batch of chunk(records)) {
        if (batch.length > 0) await target[model].createMany({ data: batch });
      }

      const destinationCount = await target[model].count();
      if (destinationCount !== records.length) {
        throw new Error(`Verification failed for ${model}: source=${records.length}, destination=${destinationCount}`);
      }
      summary.push({ model, source: records.length, destination: destinationCount, status: 'migrated' });
    }

    console.table(summary);
    console.log('Migration completed and row counts were verified.');
  } finally {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  }
}

main().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
});
