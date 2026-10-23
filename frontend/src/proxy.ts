import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

// An optimistic check only: it looks for the cookie, not whether the token is still valid
// (checking would put a slow API call in front of every page). The API is the real gate, and
// a 401 from it sends the user back to /login (see lib/client-api.ts).
export function proxy(req: NextRequest) {
  const signedIn = req.cookies.has(SESSION_COOKIE);
  const { pathname } = req.nextUrl;
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  if (isDashboard && !signedIn) return NextResponse.redirect(new URL('/login', req.url));
  if (!isDashboard && signedIn) return NextResponse.redirect(new URL('/dashboard', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/login', '/register'] };
