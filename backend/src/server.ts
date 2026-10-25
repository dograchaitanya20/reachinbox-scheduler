import { extraRoutes } from './extras';
import { es, ensureIndex, indexEmails } from './search';
import { slackRoutes } from './slack';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { env } from './env';
import { prisma } from './db';
import { queue } from './queue';
import { plan } from './plan';
import { authRouter, requireAuth, getUser, type AuthUser } from './auth';

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(passport.initialize());

// Unprotected Auth routes
app.use('/api/auth', authRouter);

// Authentication gate: Protect everything under /api and /admin/queues except /api/auth/* and /api/slack/callback
app.use((req, res, next) => {
  const p = req.path;
  if (p.startsWith('/api/auth') || p === '/api/slack/callback') {
    return next();
  }
  if (p.startsWith('/api') || p.startsWith('/admin/queues')) {
    return requireAuth(req, res, next);
  }
  next();
});

// GET /api/me
app.get('/api/me', (req, res) => {
  const user = (req as any).user as AuthUser;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
  });
});

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
  const user = (req as any).user as AuthUser;
  const limit = Math.min(p.data.hourlyLimit, env.maxPerHour);

  const serverNow = Date.now();
  const planStart = Math.max(+startTime, serverNow);
  console.log('[schedule] raw startTime from client:', req.body.startTime);
  console.log('[schedule] parsed startTime:', startTime.toISOString(), 'epoch:', +startTime);
  console.log('[schedule] server now:', new Date(serverNow).toISOString(), 'epoch:', serverNow);
  console.log('[schedule] planStart:', new Date(planStart).toISOString(), 'epoch:', planStart);
  console.log('[schedule] startTime is in future:', +startTime > serverNow, 'by', ((+startTime - serverNow) / 60000).toFixed(1), 'min');
  console.log('[schedule] delaySec:', delaySec, 'leads:', leads.length, 'senders:', senders.length, 'limit:', limit);

  const slots = plan(leads.length, senders.length, planStart, delaySec * 1000, limit);
  const rows = leads.map((to, i) => {
    const slot = slots[i]!;
    const sender = senders[slot.senderIdx]!;
    return {
      id: randomUUID(),
      userId: user.id,
      senderId: sender.id,
      to,
      subject,
      body,
      seq: i,
      scheduledAt: new Date(slot.at),
    };
  });

  // Log first few slots for debugging
  rows.slice(0, 3).forEach((r, i) => {
    const delayMs = +r.scheduledAt - serverNow;
    console.log(`[schedule] row[${i}]: scheduledAt=${r.scheduledAt.toISOString()}, delay=${delayMs}ms (${(delayMs / 60000).toFixed(1)}min)`);
  });

  await prisma.email.createMany({ data: rows });
  await indexEmails(rows);
  const now = Date.now();
  await queue.addBulk(rows.map((r) => ({
    name: 'send', data: { emailId: r.id },
    opts: { jobId: r.id, delay: Math.max(0, +r.scheduledAt - now), removeOnComplete: { count: 1000 } },
  })));
  res.status(201).json({
    scheduled: rows.length,
    firstAt: rows[0]?.scheduledAt,
    lastAt: rows[rows.length - 1]?.scheduledAt,
  });
});

app.get('/api/emails', async (req, res) => {
  const user = (req as any).user as AuthUser;
  const sent = req.query.status === 'sent';
  res.json(await prisma.email.findMany({
    where: { userId: user.id, status: { in: sent ? ['sent', 'failed'] : ['scheduled', 'sending'] } },
    orderBy: { scheduledAt: sent ? 'desc' : 'asc' }, take: 500,
  }));
});

const board = new ExpressAdapter();
board.setBasePath('/admin/queues');
createBullBoard({ queues: [new BullMQAdapter(queue)], serverAdapter: board });
app.use('/admin/queues', board.getRouter());

app.get('/api/search', async (req, res) => {
  const user = (req as any).user as AuthUser;
  const q = String(req.query.q ?? '').trim();
  const r = await es.search({
    index: 'emails',
    size: 50,
    sort: [{ scheduledAt: 'desc' }],
    query: {
      bool: {
        filter: [{ term: { userId: user.id } }],
        must: q ? [{ multi_match: { query: q, fields: ['to', 'subject', 'body'], fuzziness: 'AUTO' } }] : [{ match_all: {} }],
      },
    },
  });
  res.json(r.hits.hits.map((h) => ({ id: h._id, ...(h._source as object) })));
});

app.use('/api/slack', slackRoutes(getUser));
app.use('/api', extraRoutes(getUser));

const initEs = (n = 0) => ensureIndex().catch((e) => {
    console.error('es unavailable:', e.message);
    if (n < 20) setTimeout(() => initEs(n + 1), 5000);
});
initEs();

app.listen(env.port, () => console.log(`API on :${env.port}`));

