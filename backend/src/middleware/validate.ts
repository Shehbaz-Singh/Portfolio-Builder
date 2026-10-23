import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

// Validates req.body against a shared Zod schema and replaces it with the parsed value
// (trimmed, lowercased, defaults applied). Failures go to the error handler as a ZodError.
export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };
}
