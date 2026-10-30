// A rate limit for the public file routes (the resume PDF, the contact card), per visitor address.
// In memory, so each server instance counts for itself: it stops a script hammering one instance, and
// the response caches do the rest. Nothing is stored beyond the window, and no address is logged.

export function createLimiter(windowMs: number, maxPerWindow: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  // Returns 0 when the request may go ahead, otherwise the seconds to wait.
  return (ip: string): number => {
    const now = Date.now();
    if (hits.size > 5000) {
      for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
    }
    const entry = hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return 0;
    }
    entry.count += 1;
    return entry.count > maxPerWindow ? Math.ceil((entry.resetAt - now) / 1000) : 0;
  };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return req.headers.get('x-real-ip') ?? forwarded ?? 'unknown';
}

export const tooManyRequests = (wait: number) =>
  new Response('Too many requests', { status: 429, headers: { 'Retry-After': String(wait) } });
