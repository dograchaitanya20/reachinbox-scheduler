import { Router, type Request } from 'express';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { prisma } from './db';
import { redis } from './redis';
const v = (k: string) => process.env[k] ?? '';
const front = () => v('FRONTEND_URL') || 'http://localhost:3000';
export const slackRoutes = (getUser: (req: Request) => Promise<{ id: string }>) => {
  const r = Router();
  r.get('/status', async (req, res) => {
    const u = await getUser(req);
    res.json({ connected: !!(await prisma.slackIntegration.findUnique({ where: { userId: u.id } })) });
  });
  r.get('/connect', async (req, res) => {
    const u = await getUser(req);
    const state = jwt.sign({ uid: u.id }, v('JWT_SECRET'), { expiresIn: '10m' }); // ties the callback to this user
    const q = new URLSearchParams({ client_id: v('SLACK_CLIENT_ID'), scope: 'incoming-webhook', redirect_uri: v('SLACK_REDIRECT_URI'), state });
    res.redirect(`https://slack.com/oauth/v2/authorize?${q}`);
  });
  r.get('/callback', async (req, res) => {
    try {
      const { uid } = jwt.verify(String(req.query.state), v('JWT_SECRET')) as { uid: string };
      const out: any = await (await fetch('https://slack.com/api/oauth.v2.access', { method: 'POST', body: new URLSearchParams({
        code: String(req.query.code), client_id: v('SLACK_CLIENT_ID'), client_secret: v('SLACK_CLIENT_SECRET'), redirect_uri: v('SLACK_REDIRECT_URI') }) })).json();
      if (!out.ok) throw new Error(out.error);
      const webhookUrl = out.incoming_webhook.url as string;
      await prisma.slackIntegration.upsert({ where: { userId: uid }, update: { webhookUrl }, create: { userId: uid, webhookUrl } });
      res.redirect(`${front()}/?slack=connected`);
    } catch (e) { console.error('slack oauth failed:', (e as Error).message); res.redirect(`${front()}/?slack=error`); }
  });
  r.delete('/', async (req, res) => {
    const u = await getUser(req);
    await prisma.slackIntegration.deleteMany({ where: { userId: u.id } });
    res.status(204).end();
  });
  return r;
};
// Called by the worker when a sender hits its hourly cap. Never throws.
export async function notifyLimit(userId: string, senderId: string, senderUser: string, hk: number) {
  try {
    const s = await prisma.slackIntegration.findUnique({ where: { userId } });
    if (!s) return; // not connected: skip silently, works as soon as they connect
    if (!(await redis.set(`slack:${senderId}:${hk}`, '1', 'EX', 7200, 'NX'))) return; // once per sender per hour window
    await fetch(s.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `:warning: Hourly limit (${env.maxPerHour}) reached for sender ${senderUser}. Remaining emails were rescheduled to the next hour window.` }) });
  } catch (e) { console.error('slack notify failed:', (e as Error).message); }
}
