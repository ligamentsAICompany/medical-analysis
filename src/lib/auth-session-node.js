import { createHmac, timingSafeEqual } from 'node:crypto';
import { AUTH_COOKIE_NAME, getAuthSecret } from './auth-config';

const SESSION_DAYS = 7;

export function getCookieName() {
  return AUTH_COOKIE_NAME;
}

export function signSession({ email, name }) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ email, name, exp });
  const payloadHex = Buffer.from(payload, 'utf8').toString('hex');
  const secret = getAuthSecret();
  const sig = createHmac('sha256', secret).update(payloadHex, 'utf8').digest('hex');
  return `${payloadHex}.${sig}`;
}

export function verifySession(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payloadHex = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^[0-9a-f]+$/i.test(payloadHex) || !/^[0-9a-f]+$/i.test(sig)) return null;

  const secret = getAuthSecret();
  const expectedSig = createHmac('sha256', secret).update(payloadHex, 'utf8').digest('hex');

  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  let data;
  try {
    const json = Buffer.from(payloadHex, 'hex').toString('utf8');
    data = JSON.parse(json);
  } catch {
    return null;
  }

  if (!data || typeof data.email !== 'string' || typeof data.exp !== 'number') return null;
  if (Date.now() > data.exp) return null;

  return {
    email: data.email,
    name: typeof data.name === 'string' ? data.name : data.email.split('@')[0],
  };
}
