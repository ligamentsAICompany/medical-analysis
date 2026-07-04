import { NextResponse } from 'next/server';
import { getExpectedCredentials } from '../../../../lib/auth-config';
import { verifyFirebaseIdToken } from '../../../../lib/firebase-verify';
import { getCookieName, signSession } from '../../../../lib/auth-session-node';

function setSessionCookie (res, email, name) {
  const token = signSession({ email, name });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set(getCookieName(), token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const idToken = typeof body.idToken === 'string' ? body.idToken.trim() : '';

  if (idToken) {
    try {
      const firebaseUser = await verifyFirebaseIdToken(idToken);
      const res = NextResponse.json({
        user: {
          email: firebaseUser.email,
          name: firebaseUser.name,
          uid: firebaseUser.uid,
        },
      });
      return setSessionCookie(res, firebaseUser.email, firebaseUser.name);
    } catch (err) {
      return NextResponse.json(
        { error: err?.message || 'Invalid Firebase session' },
        { status: 401 }
      );
    }
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const expected = getExpectedCredentials();
  if (email !== expected.email.toLowerCase() || password !== expected.password) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const name = email.split('@')[0];
  const res = NextResponse.json({ user: { email, name } });
  return setSessionCookie(res, email, name);
}
