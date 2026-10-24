import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from './db';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'reachinbox-scheduler-jwt-secret-key-12345';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback';

export async function upsertGoogleUser(profileData: {
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
}): Promise<AuthUser> {
  const { googleId, email, name, avatar } = profileData;

  let user = await prisma.user.findUnique({ where: { googleId } });
  if (!user) {
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, name, avatar: avatar ?? user.avatar },
      });
    } else {
      user = await prisma.user.create({
        data: { googleId, email, name, avatar },
      });
    }
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { email, name, avatar: avatar ?? user.avatar },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
  };
}

const hasGoogleCreds = Boolean(
  GOOGLE_CLIENT_ID &&
  GOOGLE_CLIENT_SECRET &&
  !GOOGLE_CLIENT_ID.includes('your-google-client-id') &&
  GOOGLE_CLIENT_ID !== 'dummy'
);

if (hasGoogleCreds) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value ?? `${googleId}@gmail.com`;
          const name = profile.displayName || profile.name?.givenName || 'User';
          const avatar = profile.photos?.[0]?.value || null;

          const user = await upsertGoogleUser({ googleId, email, name, avatar });
          return done(null, user);
        } catch (err) {
          return done(err as Error, undefined);
        }
      }
    )
  );
}

export const extractToken = (req: Request): string | null => {
  if (req.cookies && req.cookies.session) {
    return req.cookies.session;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, avatar: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

export const getUser = async (req: Request): Promise<AuthUser> => {
  if ((req as any).user) {
    return (req as any).user as AuthUser;
  }
  const token = extractToken(req);
  if (!token) {
    throw new Error('Unauthorized');
  }
  const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, name: true, avatar: true },
  });
  if (!user) {
    throw new Error('User not found');
  }
  (req as any).user = user;
  return user;
};

export const authRouter = Router();

authRouter.get('/google', (req, res, next) => {
  if (!hasGoogleCreds) {
    // When Google credentials are not yet configured in local environment,
    // seamlessly authenticate with a default user (Oliver Brown) matching Figma design
    upsertGoogleUser({
      googleId: 'dev-google-user',
      email: 'oliver.brown@domain.io',
      name: 'Oliver Brown',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=face',
    }).then((user) => {
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.redirect(FRONTEND_URL);
    }).catch(next);
    return;
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(req, res, next);
});

authRouter.get(
  '/google/callback',
  (req, res, next) => {
    if (!hasGoogleCreds) {
      return res.redirect(FRONTEND_URL);
    }
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${FRONTEND_URL}/login?error=auth_failed`,
    })(req, res, next);
  },
  (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(FRONTEND_URL);
  }
);

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ ok: true });
});
