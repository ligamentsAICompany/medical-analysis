/**
 * Session verify for Edge (middleware). Must match `signSession` in auth-session-node.js.
 */

function hexToUtf8(hex) {
  const len = hex.length / 2;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualStr(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export async function verifySessionEdge(token, secret) {
  if (!token || typeof token !== 'string' || !secret) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payloadHex = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^[0-9a-f]+$/i.test(payloadHex) || !/^[0-9a-f]+$/i.test(sig)) return null;

  const expectedSig = await hmacSha256Hex(secret, payloadHex);
  if (!timingSafeEqualStr(sig.toLowerCase(), expectedSig.toLowerCase())) return null;

  let data;
  try {
    data = JSON.parse(hexToUtf8(payloadHex));
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
