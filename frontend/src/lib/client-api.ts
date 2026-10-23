import { apiErrorSchema } from '@portfolio/shared';

// Browser-side API client. It calls this site's /api proxy (which attaches the JWT from the
// httpOnly cookie), parses the API's error format and sends the user to /login on a 401.

export class ApiError extends Error {
  constructor(
    readonly status: number, // 0 = the request never got an answer
    readonly code: string,
    message: string,
    readonly details: { path: string; message: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown; // sent as JSON
  form?: FormData; // sent as multipart (uploads)
  signal?: AbortSignal;
  // Login and register get a 401 for a wrong password, which is not an expired session.
  redirectOn401?: boolean;
}

// A free-tier backend that is waking up answers 502/503/504 (or drops the connection) for a
// while. Reads are safe to repeat, so they retry; writes are never repeated automatically.
const RETRY_STATUSES = new Set([502, 503, 504]);
const READ_ATTEMPTS = 3;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function attempt(path: string, options: Options): Promise<Response | ApiError> {
  try {
    return await fetch(`/api${path}`, {
      method: options.method ?? 'GET',
      headers: options.body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
      signal: options.signal,
    });
  } catch (err) {
    if (options.signal?.aborted) throw err;
    return new ApiError(0, 'NETWORK', "Couldn't reach the server. Check your connection.");
  }
}

async function toError(res: Response): Promise<ApiError> {
  const parsed = apiErrorSchema.safeParse(await res.json().catch(() => null));
  if (parsed.success) {
    const { code, message, details } = parsed.data.error;
    return new ApiError(res.status, code, message, details);
  }
  return new ApiError(res.status, `HTTP_${res.status}`, 'Something went wrong. Please try again.');
}

export async function api<T = void>(path: string, options: Options = {}): Promise<T> {
  const isRead = (options.method ?? 'GET') === 'GET';
  const attempts = isRead ? READ_ATTEMPTS : 1;

  for (let n = 1; ; n++) {
    const result = await attempt(path, options);
    const failure = result instanceof ApiError ? result : result.ok ? null : await toError(result);
    if (!failure) {
      const res = result as Response;
      return (res.status === 204 ? undefined : await res.json()) as T;
    }

    if (failure.status === 401 && options.redirectOn401 !== false) {
      // The proxy has already dropped the dead cookie. A full navigation also resets all
      // page state. The promise never settles so callers do not flash an error meanwhile.
      window.location.assign('/login?expired=1');
      return new Promise<never>(() => {});
    }
    const retryable = failure.status === 0 || RETRY_STATUSES.has(failure.status);
    if (!retryable || n >= attempts) throw failure;
    await wait(1500 * n);
  }
}
