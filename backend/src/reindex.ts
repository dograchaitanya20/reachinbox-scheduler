import { prisma } from './db';
import { ensureIndex, indexEmails } from './search';
(async () => {
  await ensureIndex();
  for (let skip = 0; ; skip += 1000) {
    const rows = await prisma.email.findMany({ skip, take: 1000, orderBy: { id: 'asc' } });
    if (!rows.length) break;
    await indexEmails(rows);
  }
  console.log('reindexed');
  process.exit(0);
})();
