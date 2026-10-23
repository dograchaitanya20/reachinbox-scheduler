import { prisma } from './db';
import { queue } from './queue';
// Runs once at worker boot (not a cron). The DB is the source of truth, Redis is rebuilt from it.
export async function reconcile() {
  // crashed mid-send: free emails stuck in 'sending' for over 5 min (claim still guarantees one send per attempt)
  await prisma.email.updateMany({ where: { status: 'sending', updatedAt: { lt: new Date(Date.now() - 5 * 60_000) } }, data: { status: 'scheduled' } });
  const rows = await prisma.email.findMany({ where: { status: 'scheduled' }, select: { id: true, scheduledAt: true } });
  let n = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const jobs = await Promise.all(chunk.map((r) => queue.getJob(r.id)));
    const missing = chunk.filter((_, j) => !jobs[j]);
    if (missing.length) await queue.addBulk(missing.map((r) => ({
      name: 'send', data: { emailId: r.id },
      opts: { jobId: r.id, delay: Math.max(0, +r.scheduledAt - Date.now()), removeOnComplete: { count: 1000 } },
    })));
    n += missing.length;
  }
  console.log(`reconcile: re-enqueued ${n} missing jobs`);
}

