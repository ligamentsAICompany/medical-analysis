import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCookieName, verifySession } from '../../../../src/lib/auth-session-node';

export async function GET() {
  const jar = await cookies();
  const raw = jar.get(getCookieName())?.value;
  const user = verifySession(raw);
  return NextResponse.json({ user: user || null });
}
