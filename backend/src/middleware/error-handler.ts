import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiError } from '@portfolio/shared';
import { ZodError } from 'zod';
import { config } from '../lib/config';
import { AppError } from '../lib/errors';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.path}`));
};

function send(res: Parameters<ErrorRequestHandler>[2], status: number, error: ApiError['error']) {
  res.status(status).json({ error } satisfies ApiError);
}

// Every error ends up here and is sent as { error: { code, message, details? } }.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express needs all 4 arguments
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return send(res, err.status, {
      code: err.code,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  if (err instanceof ZodError) {
    return send(res, 400, {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  // Errors raised by express.json() for bad bodies carry an http status and a type.
  if (typeof err === 'object' && err !== null && 'type' in err) {
    if (err.type === 'entity.parse.failed') {
      return send(res, 400, { code: 'INVALID_JSON', message: 'Request body is not valid JSON' });
    }
    if (err.type === 'entity.too.large') {
      return send(res, 413, { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' });
    }
  }

  console.error(err);
  send(res, 500, {
    code: 'INTERNAL_ERROR',
    message:
      config.NODE_ENV === 'production'
        ? 'Something went wrong'
        : `Something went wrong: ${err instanceof Error ? err.message : String(err)}`,
  });
};
