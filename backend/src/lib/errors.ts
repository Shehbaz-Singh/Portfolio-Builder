import type { ApiError } from '@parichay/shared';

type ErrorDetails = NonNullable<ApiError['error']['details']>;

// An error that is safe to show to the client. Anything else becomes a generic 500.
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetails,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED') {
    return new AppError(401, code, message);
  }

  static conflict(code: string, message: string) {
    return new AppError(409, code, message);
  }

  static notFound(message = 'Not found') {
    return new AppError(404, 'NOT_FOUND', message);
  }
}
