import type { RequestHandler } from 'express';
import multer from 'multer';
import { AppError } from '../lib/errors';

interface UploadOptions {
  field: string; // the multipart field name
  maxBytes: number;
  allowedTypes: string[];
  typeMessage: string;
  sizeMessage: string;
  invalidMessage: string;
}

// Memory storage: the file stays in a Buffer for this request only, never on disk. The declared
// type is only a cheap first check; the services verify the real bytes (detectImageType,
// looksLikePdf). Every upload failure becomes the API's standard error format.
function singleFileUpload(options: UploadOptions): RequestHandler {
  const { field, maxBytes, allowedTypes, typeMessage, sizeMessage, invalidMessage } = options;
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) return cb(null, true);
      cb(new AppError(400, 'UNSUPPORTED_FILE_TYPE', typeMessage));
    },
  }).single(field);

  return (req, res, next) => {
    upload(req, res, (err: unknown) => {
      if (!err) return next();
      if (err instanceof AppError) return next(err);
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(413, 'FILE_TOO_LARGE', sizeMessage));
      }
      next(new AppError(400, 'INVALID_UPLOAD', invalidMessage));
    });
  };
}

// One image in the "avatar" field, up to 2 MB, into req.file.
export const avatarUpload = singleFileUpload({
  field: 'avatar',
  maxBytes: 2 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  typeMessage: 'Only JPG, PNG and WebP images are allowed',
  sizeMessage: 'Image must be 2 MB or smaller',
  invalidMessage: 'Send one image in the "avatar" form field',
});

// One PDF in the "resume" field, up to 5 MB, into req.file.
export const resumeUpload = singleFileUpload({
  field: 'resume',
  maxBytes: 5 * 1024 * 1024,
  allowedTypes: ['application/pdf'],
  typeMessage: 'Only PDF files are supported',
  sizeMessage: 'The PDF must be 5 MB or smaller',
  invalidMessage: 'Send one PDF in the "resume" form field',
});
