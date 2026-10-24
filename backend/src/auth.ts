import 'dotenv/config';
import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from './db';
export interface AuthUser { id: string; email: string; name: string; avatar: string | null }
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const { GOOGLE_CLIENT_ID = '', GOOGLE_CLIENT_SECRET = '' } = process.env;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback';
const JWT_SECRET = process.env.JWT_SECRET ?? '';
if (!JWT_SECRET) throw new Error('JWT_SECRET is required');
const googleConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
if (!googleConfigured) console.warn('Google OAuth is not configured: login is disabled');
const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const };
const sign = (u: { id: string; email: string }) => jwt.sign({ id: u.id, email: u.email }, JWT_SECRET, { expiresIn: '7d' });
const verify = (t: string) => jwt.verify(t, JWT_SECRET, { algorithms: ['HS256'] }) as { id: string; email: string };
export async function upsertGoogleUser(p: { googleId: string; email: string; name: string; avatar: string | null }): Promise<AuthUser> {
  const existing = (await prisma.user.findUnique({ where: { googleId: p.googleId } })) ?? (await prisma.user.findUnique({ where: { email: p.email } }));
  const data = { googleId: p.googleId, email: p.email, name: p.name, avatar: p.avatar ?? existing?.avatar ?? null };
  const u = existing ? await prisma.user.update({ where: { id: existing.id }, data }) : await prisma.user.create({ data });
  return { id: u.id, email: u.email, name: u.name, avatar: u.avatar };
}
if (googleConfigured) {
  passport.use(new GoogleStrategy(
    { clientID: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET, callbackURL: GOOGLE_CALLBACK_URL },
    async (_a, _r, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('Google account has no email'));
        done(null, await upsertGoogleUser({ googleId: profile.id, email, name: profile.displayName || email, avatar: profile.photos?.[0]?.value ?? null }));
      } catch (e) { done(e as Error); }
    }));
}
export const extractToken = (req: Request): string | null =>
  req.cookies?.session ?? (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
export const getUser = async (req: Request): Promise<AuthUser> => {
  const cached = (req as any).user as AuthUser | undefined;
  if (cached) return cached;
  const token = extractToken(req);
  if (!token) throw new Error('Unauthorized');
  const u = await prisma.user.findUnique({ where: { id: verify(token).id }, select: { id: true, email: true, name: true, avatar: true } });
  if (!u) throw new Error('Unauthorized');
  (req as any).user = u;
  return u;
};
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try { await getUser(req); next(); } catch { res.status(401).json({ error: 'Unauthorized' }); }
};
export const authRouter = Router();
authRouter.get('/google', (req, res, next) => {
  if (!googleConfigured) return res.status(503).json({ error: 'Google OAuth is not configured' });
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});
authRouter.get('/google/callback',
  (req, res, next) => {
    if (!googleConfigured) return res.status(503).json({ error: 'Google OAuth is not configured' });
    passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=auth_failed` })(req, res, next);
  },
  (req: Request, res: Response) => {
    res.cookie('session', sign(req.user as AuthUser), { ...cookieOpts, maxAge: 7 * 24 * 3600 * 1000 });
    res.redirect(FRONTEND_URL);
  });
authRouter.post('/logout', (_req: Request, res: Response) => { res.clearCookie('session', cookieOpts); res.json({ ok: true }); });
