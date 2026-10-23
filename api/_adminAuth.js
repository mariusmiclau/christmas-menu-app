import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_COOKIE_NAME = 'christmas_menu_admin';
export const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function sign(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function adminAuthConfig() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || '';
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || '';

  return {
    username,
    password,
    sessionSecret,
    configured: password.length >= 12 && sessionSecret.length >= 32,
  };
}

export function credentialsMatch(username, password, config = adminAuthConfig()) {
  if (!config.configured) return false;
  return safeEqual(username, config.username) && safeEqual(password, config.password);
}

export function createAdminToken(secret, now = Date.now(), ttlMs = ADMIN_SESSION_TTL_MS) {
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: now + ttlMs })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyAdminToken(token, secret, now = Date.now()) {
  if (!token || !secret) return false;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra || !safeEqual(signature, sign(payload, secret))) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.role === 'admin' && Number.isFinite(session.exp) && session.exp > now;
  } catch {
    return false;
  }
}

export function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return cookies;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name) {
      try {
        cookies[name] = decodeURIComponent(value);
      } catch {
        cookies[name] = value;
      }
    }
    return cookies;
  }, {});
}

export function requestHasAdminSession(request, config = adminAuthConfig()) {
  if (!config.configured) return false;
  const cookies = parseCookies(request.headers.cookie || '');
  return verifyAdminToken(cookies[ADMIN_COOKIE_NAME], config.sessionSecret);
}

export function adminSessionCookie(token, request, maxAgeSeconds = ADMIN_SESSION_TTL_MS / 1000) {
  const forwardedProtocol = request.headers['x-forwarded-proto'];
  const secure = process.env.VERCEL || forwardedProtocol === 'https';
  return [
    `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}

export function sendJson(response, status, body) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.status(status).json(body);
}
