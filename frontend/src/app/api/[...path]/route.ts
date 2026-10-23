import { NextResponse, type NextRequest } from 'next/server';
import { API_URL, PROXY_SECRET } from '@/lib/config';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';

// The browser never talks to the Express API directly. It calls /api/... on this site, and
// this handler forwards the call, attaching the JWT from the httpOnly cookie. That keeps the
// token out of reach of page scripts and avoids CORS entirely.

// The free-tier API can take most of a minute to wake up; give the proxy room to wait.
export const maxDuration = 60;
const UPSTREAM_TIMEOUT_MS = 55_000;

const FORWARDED_AREAS = new Set(['auth', 'profile']);
const MAX_BODY_BYTES = 3 * 1024 * 1024; // the avatar limit is 2 MB, plus multipart overhead

const fail = (status: number, code: string, message: string) =>
  NextResponse.json({ error: { code, message } }, { status });

type Context = { params: Promise<{ path: string[] }> };

async function handle(req: NextRequest, { params }: Context) {
  const { path } = await params;
  const route = path.join('/');

  if (!FORWARDED_AREAS.has(path[0]) || path.some((s) => s === '.' || s === '..')) {
    return fail(404, 'NOT_FOUND', 'Not found');
  }

  const isRead = req.method === 'GET' || req.method === 'HEAD';

  // CSRF: the cookie is SameSite=Lax already; this also refuses any browser request that
  // declares another site as its origin.
  const origin = req.headers.get('origin');
  if (!isRead && origin && new URL(origin).host !== req.headers.get('host')) {
    return fail(403, 'FORBIDDEN', 'Cross-site requests are not allowed');
  }

  // Logging out only means forgetting the cookie; the API keeps no session state.
  if (req.method === 'POST' && route === 'auth/logout') {
    const res = new NextResponse(null, { status: 204 });
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (PROXY_SECRET) {
    headers.set('x-proxy-secret', PROXY_SECRET);
    const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0];
    if (ip) headers.set('x-client-ip', ip.trim());
  }

  let body: ArrayBuffer | undefined;
  if (!isRead) {
    if (Number(req.headers.get('content-length')) > MAX_BODY_BYTES) {
      return fail(413, 'FILE_TOO_LARGE', 'That upload is too large');
    }
    body = await req.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES)
      return fail(413, 'FILE_TOO_LARGE', 'That upload is too large');
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${API_URL}/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`,
      {
        method: req.method,
        headers,
        body,
        redirect: 'manual',
        cache: 'no-store',
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      },
    );
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    return timedOut
      ? fail(504, 'UPSTREAM_TIMEOUT', 'The server took too long to respond')
      : fail(502, 'UPSTREAM_UNAVAILABLE', 'Could not reach the server');
  }

  // Login and register answer with a token. It goes into the cookie and never to the browser.
  if (
    req.method === 'POST' &&
    (route === 'auth/login' || route === 'auth/register') &&
    upstream.ok
  ) {
    const { token: issued, ...session } = await upstream.json();
    const res = NextResponse.json(session, { status: upstream.status });
    res.cookies.set(SESSION_COOKIE, issued, sessionCookieOptions(issued));
    return res;
  }

  const res = new NextResponse(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store',
    },
  });
  // An expired or revoked token: forget it, so the route guard stops treating us as signed in.
  if (upstream.status === 401 && token) res.cookies.delete(SESSION_COOKIE);
  return res;
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
