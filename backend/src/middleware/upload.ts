import type { RequestHandler } from 'express';
import multer from 'multer';
import { AppError } from '../lib/errors';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Memory storage: the file stays in a Buffer and goes straight to Cloudinary, never to disk.
// This filter trusts the declared type only as a cheap first check; the real check is
// detectImageType() on the bytes.
const singleAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) return cb(null, true);
    cb(new AppError(400, 'UNSUPPORTED_FILE_TYPE', 'Only JPG, PNG and WebP images are allowed'));
  },
}).single('avatar');

// Parses multipart/form-data with one image in the "avatar" field into req.file, and turns
// every upload failure into the API's standard error format.
export const avatarUpload: RequestHandler = (req, res, next) => {
  singleAvatar(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof AppError) return next(err);
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(413, 'FILE_TOO_LARGE', 'Image must be 2 MB or smaller'));
    }
    next(new AppError(400, 'INVALID_UPLOAD', 'Send one image in the "avatar" form field'));
  });
};
