import type { RequestHandler } from 'express';

// A bot fills in every field it finds, including one a person never sees. A request that has a
// value in `field` is answered exactly like a successful one and goes no further, so the bot
// has no way to tell it was dropped.
export const honeypot =
  (field: string): RequestHandler =>
  (req, res, next) => {
    const value = (req.body as Record<string, unknown> | undefined)?.[field];
    if (typeof value === 'string' && value.trim() !== '') {
      res.status(201).json({ received: true });
      return;
    }
    next();
  };
