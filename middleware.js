import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getAuthSecret } from './src/lib/auth-config';
import { verifySessionEdge } from './src/lib/auth-session-edge';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const secret = getAuthSecret();
  const user = token ? await verifySessionEdge(token, secret) : null;

  if (pathname.startsWith('/login')) {
    if (user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!user) {
    const login = new URL('/login', request.url);
    login.searchParams.set('from', pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/analysis/:path*'],
};
