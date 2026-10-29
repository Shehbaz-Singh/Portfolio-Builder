import { AppError } from './errors';
import { deleteImage } from './cloudinary';
import { detectImageType } from './image';
import { ERRORS } from './messages';
import { ERROR_CODES } from '@parichay/shared';

const reason = (err: unknown) => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err && typeof err.message === 'string') {
    return err.message;
  }
  return 'unknown error';
};

// Deleting is housekeeping: a failure only leaves an unused image behind, so it is logged (without
// any id, so the log does not say whose image it was) and never fails the request.
export async function deleteImageQuietly(publicId: string, what: string) {
  try {
    await deleteImage(publicId);
  } catch (err) {
    console.warn(`Could not delete ${what}:`, reason(err));
  }
}

interface ReplaceOptions<C, U> {
  file: Buffer;
  // Reads what is there now (and fails if the owner's record does not exist).
  load: () => Promise<C>;
  upload: () => Promise<U>;
  // Points the owner's record at the new image.
  save: (uploaded: U) => Promise<unknown>;
  // Removes the new image again when `save` fails, so no image is left that nothing points to.
  discardNew: (uploaded: U) => Promise<void>;
  // Removes the image that was replaced, once the new one is saved.
  discardOld: (current: C) => Promise<void>;
}

// Puts a new image in place of an old one in the order that cannot leave a broken image: check the
// bytes, read what is there, upload, save the reference, and only then delete the old file.
export async function replaceImage<C, U>(options: ReplaceOptions<C, U>): Promise<U> {
  if (!detectImageType(options.file)) {
    throw new AppError(400, 'UNSUPPORTED_FILE_TYPE', ERRORS.imageTypes);
  }

  const current = await options.load();

  let uploaded: U;
  try {
    uploaded = await options.upload();
  } catch (err) {
    console.error('Cloudinary upload failed:', reason(err));
    throw new AppError(502, ERROR_CODES.UPLOAD_FAILED, ERRORS.imageUploadFailed);
  }

  try {
    await options.save(uploaded);
  } catch (err) {
    await options.discardNew(uploaded);
    throw err;
  }
  await options.discardOld(current);
  return uploaded;
}
