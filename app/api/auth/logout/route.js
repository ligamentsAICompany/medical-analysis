import { NextResponse } from 'next/server';
import { getCookieName } from '../../../../src/lib/auth-session-node';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set(getCookieName(), '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
