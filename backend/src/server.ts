import { extraRoutes } from './extras';
import { es, ensureIndex, indexEmails } from './search';
import { slackRoutes } from './slack';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { env } from './env';
import { prisma } from './db';
import { queue } from './queue';
import { plan } from './plan';
const app = express();
app.use(cors(), express.json({ limit: '5mb' }));
// TEMP until Google OAuth: every request acts as one dev user
const devUser = () => prisma.user.upsert({ where: { googleId: 'dev' }, update: {}, create: { googleId: 'dev', email: 'dev@local', name: 'Dev User' } });
const schema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  leads: z.array(z.string().email()).min(1).max(5000),
  startTime: z.coerce.date(),
  delaySec: z.number().min(0).default(2),
  hourlyLimit: z.number().int().min(1).default(env.maxPerHour),
  senderId: z.string().optional(),
});
app.post('/api/schedule', async (req, res) => {
  const p = schema.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error.flatten());
  const { subject, body, startTime, delaySec } = p.data;
  const leads = [...new Set(p.data.leads.map((l) => l.toLowerCase()))];
  const senders = await prisma.sender.findMany({ where: p.data.senderId ? { id: p.data.senderId } : {}, orderBy: { id: 'asc' } });
  if (!senders.length) return res.status(409).json({ error: 'No senders. Run: npm run seed' });
  const user = await devUser();
  const limit = Math.min(p.data.hourlyLimit, env.maxPerHour);
  const slots = plan(leads.length, senders.length, Math.max(+startTime, Date.now()), delaySec * 1000, limit);
  const rows = leads.map((to, i) => ({
    id: randomUUID(), userId: user.id, senderId: senders[slots[i].senderIdx].id,
    to, subject, body, seq: i, scheduledAt: new Date(slots[i].at),
  }));
  await prisma.email.createMany({ data: rows });
await indexEmails(rows);
  const now = Date.now();
  await queue.addBulk(rows.map((r) => ({
    name: 'send', data: { emailId: r.id },
    opts: { jobId: r.id, delay: Math.max(0, +r.scheduledAt - now), removeOnComplete: { count: 1000 } },
  })));
  res.status(201).json({ scheduled: rows.length, firstAt: rows[0].scheduledAt, lastAt: rows[rows.length - 1].scheduledAt });
});
app.get('/api/emails', async (req, res) => {
  const user = await devUser();
  const sent = req.query.status === 'sent';
  res.json(await prisma.email.findMany({
    where: { userId: user.id, status: { in: sent ? ['sent', 'failed'] : ['scheduled', 'sending'] } },
    orderBy: { scheduledAt: sent ? 'desc' : 'asc' }, take: 500,
  }));
});
const board = new ExpressAdapter(); board.setBasePath('/admin/queues');
createBullBoard({ queues: [new BullMQAdapter(queue)], serverAdapter: board });
app.use('/admin/queues', board.getRouter());

app.get('/api/search', async (req, res) => {
  const user = await devUser(); const q = String(req.query.q ?? '').trim();
  const r = await es.search({ index: 'emails', size: 50, sort: [{ scheduledAt: 'desc' }], query: { bool: {
    filter: [{ term: { userId: user.id } }],
    must: q ? [{ multi_match: { query: q, fields: ['to', 'subject', 'body'], fuzziness: 'AUTO' } }] : [{ match_all: {} }] } } });
  res.json(r.hits.hits.map((h) => ({ id: h._id, ...(h._source as object) })));
});
app.use('/api/slack', slackRoutes(devUser));
app.use('/api', extraRoutes(devUser));
ensureIndex().catch((e) => console.error('es unavailable:', e.message));app.listen(env.port, () => console.log(`API on :${env.port}`));






