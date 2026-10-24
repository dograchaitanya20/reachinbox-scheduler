import { Router, type Request } from 'express';
import { prisma } from './db';
export const extraRoutes = (getUser: (req: Request) => Promise<{ id: string }>) => {
  const r = Router();
  r.get('/senders', async (_req, res) => res.json(await prisma.sender.findMany({ select: { id: true, user: true }, orderBy: { id: 'asc' } })));
  r.get('/counts', async (req, res) => {
    const u = await getUser(req);
    const c = (status: string[]) => prisma.email.count({ where: { userId: u.id, status: { in: status } } });
    const [scheduled, sent] = await Promise.all([c(['scheduled', 'sending']), c(['sent', 'failed'])]);
    res.json({ scheduled, sent });
  });
  r.get('/emails/:id', async (req, res) => {
    const u = await getUser(req);
    const e = await prisma.email.findFirst({ where: { id: req.params.id, userId: u.id }, include: { sender: { select: { user: true } } } });
    if (!e) return res.status(404).json({ error: 'not found' });
    res.json(e);
  });
  return r;
};
