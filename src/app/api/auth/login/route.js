import { NextResponse } from 'next/server';
import { getExpectedCredentials } from '../../../../lib/auth-config';
import { getCookieName, signSession } from '../../../../lib/auth-session-node';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
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
  const token = signSession({ email, name });
  const res = NextResponse.json({ user: { email, name } });

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
