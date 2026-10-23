import { Worker, DelayedError } from 'bullmq';
import nodemailer from 'nodemailer';
import type { Sender } from '@prisma/client';
import { env } from './env';
import { prisma } from './db';
import { redis } from './redis';
import { QUEUE } from './queue';
const H = 3600_000;
// atomic check-and-increment: two workers can never both take the last slot
const LUA = `local c = tonumber(redis.call('GET', KEYS[1]) or '0')
if c >= tonumber(ARGV[1]) then return 0 end
redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], 7200)
return 1`;
const cache = new Map<string, nodemailer.Transporter>();
const transport = (s: Sender) => {
  if (!cache.has(s.id)) cache.set(s.id, nodemailer.createTransport({ host: s.host, port: s.port, auth: { user: s.user, pass: s.pass } }));
  return cache.get(s.id)!;
};
new Worker(QUEUE, async (job, token) => {
  const id = job.data.emailId as string;
  // 1. idempotent claim: only one worker can flip scheduled -> sending
  const claim = await prisma.email.updateMany({ where: { id, status: 'scheduled' }, data: { status: 'sending' } });
  if (!claim.count) return;
  const e = await prisma.email.findUniqueOrThrow({ where: { id }, include: { sender: true } });
  // 2. hourly limit per sender, counter lives in Redis
  const hk = Math.floor(Date.now() / H);
  if (!(await redis.eval(LUA, 1, `rl:${e.senderId}:${hk}`, env.maxPerHour))) {
    const next = (hk + 1) * H + e.seq; // next hour window; +seq keeps original order
    await prisma.email.update({ where: { id }, data: { status: 'scheduled', scheduledAt: new Date(next) } });
    await job.moveToDelayed(next, token); // rescheduled, never dropped
    throw new DelayedError();
  }
  // 3. send
  try {
    const info = await transport(e.sender).sendMail({ from: e.sender.user, to: e.to, subject: e.subject, text: e.body });
    await prisma.email.update({ where: { id }, data: { status: 'sent', sentAt: new Date(), messageId: info.messageId } });
    console.log('sent', e.to, nodemailer.getTestMessageUrl(info));
  } catch (err) {
    await prisma.email.update({ where: { id }, data: { status: 'failed', error: String(err) } });
  }
}, { connection: redis, concurrency: env.concurrency, limiter: { max: 1, duration: env.minDelayMs } });
console.log(`worker up: concurrency=${env.concurrency}, min delay=${env.minDelayMs}ms, cap=${env.maxPerHour}/h/sender`);

import { reconcile } from './reconcile';
reconcile().catch(console.error);
