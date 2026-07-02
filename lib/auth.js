// ── Auth ─────────────────────────────────────────────────────────
//
// Single-admin auth via environment variables. No DB round-trip on
// login, no dead/unused "users" table, no hardcoded credentials or
// deterministic fallback secret baked into the source code (the previous
// version derived its signing key from a hardcoded string, meaning anyone
// with the source could forge valid session tokens).
//
// Required env vars (set in Vercel → Settings → Environment Variables):
//   ADMIN_USERNAME   (optional, defaults to "admin")
//   ADMIN_PASSWORD   (required)
//   AUTH_SECRET      (required — generate with: openssl rand -hex 32)

import { createHmac, timingSafeEqual } from 'crypto';

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      'AUTH_SECRET is not set. Generate one with `openssl rand -hex 32` and add it in Vercel env vars.'
    );
  }
  return secret;
}

function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD is not set. Add it in Vercel env vars.');
  }
  return { username, password };
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkCredentials(username, password) {
  const admin = getAdminCredentials();
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  return safeEqual(username, admin.username) && safeEqual(password, admin.password);
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
