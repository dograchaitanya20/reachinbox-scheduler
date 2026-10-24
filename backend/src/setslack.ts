import { prisma } from './db';
(async () => {
  const url = process.argv[2];
  const u = await prisma.user.findFirstOrThrow({ where: { googleId: 'dev' } });
  await prisma.slackIntegration.upsert({ where: { userId: u.id }, update: { webhookUrl: url }, create: { userId: u.id, webhookUrl: url } });
  console.log('saved for', u.email);
  process.exit(0);
})();
