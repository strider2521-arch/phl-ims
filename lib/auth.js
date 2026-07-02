// ── Auth ─────────────────────────────────────────────────────────
//
// Multi-user login. Credentials are defined here in the source.
// AUTH_SECRET env var is still needed for signing session tokens.

import { createHmac, timingSafeEqual } from 'crypto';

const USERS = {
  Wassell: { password: 'Phlen36hl', role: 'admin' },
  Faisal:  { password: 'Phlen36tq', role: 'admin' },
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      'AUTH_SECRET is not set. Generate one with `openssl rand -hex 32` and add it in Vercel env vars.'
    );
  }
  return secret;
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  const user = USERS[username];
  if (!user) return false;
  return safeEqual(password, user.password);
}

export function createToken(username) {
  const secret = getSecret();
  const payload = Buffer.from(JSON.stringify({
    username,
    role: 'admin',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  })).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const secret = getSecret();
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    const expected = createHmac('sha256', secret).update(payload).digest('base64url');
    if (!safeEqual(sig, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || Date.now() > data.exp) return null;
    return { username: data.username, role: data.role || 'admin' };
  } catch {
    return null;
  }
}
