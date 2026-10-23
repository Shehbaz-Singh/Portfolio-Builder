// The API's JWT lives in this cookie. It is httpOnly, so page scripts (and therefore any XSS)
// can never read it; only the /api proxy route reads it and attaches it to API calls.
export const SESSION_COOKIE = 'session';

const WEEK = 7 * 24 * 60 * 60;

// The cookie should die when the token does. The expiry is read from the token's payload
// without verifying it: the API does the verifying, this only sets a lifetime.
function secondsUntilExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    const left = Math.floor(payload.exp - Date.now() / 1000);
    return left > 0 ? left : 0;
  } catch {
    return WEEK;
  }
}

export function sessionCookieOptions(token: string) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: secondsUntilExpiry(token),
  };
}
