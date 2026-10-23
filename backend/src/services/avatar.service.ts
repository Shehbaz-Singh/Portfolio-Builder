import { AppError } from '../lib/errors';
import { avatarPublicId, deleteImage, uploadAvatar } from '../lib/cloudinary';
import { detectImageType } from '../lib/image';
import { prisma } from '../lib/prisma';

// Deleting is housekeeping: a failure only leaves an unused image behind, so it is logged
// and never fails the request.
async function deleteQuietly(publicId: string) {
  try {
    await deleteImage(publicId);
  } catch (err) {
    console.warn(`Could not delete Cloudinary image ${publicId}:`, err);
  }
}

export async function replaceAvatar(profileId: string, file: Buffer) {
  if (!detectImageType(file)) {
    throw new AppError(400, 'UNSUPPORTED_FILE_TYPE', 'Only JPG, PNG and WebP images are allowed');
  }

  const current = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { avatarUrl: true },
  });
  if (!current) throw AppError.notFound('Profile not found');

  let uploaded;
  try {
    uploaded = await uploadAvatar(file, profileId);
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    throw new AppError(502, 'UPLOAD_FAILED', 'Could not upload the image, please try again');
  }

  try {
    await prisma.profile.update({ where: { id: profileId }, data: { avatarUrl: uploaded.url } });
  } catch (err) {
    await deleteQuietly(uploaded.publicId); // do not leave an image no profile points to
    throw err;
  }

  // Only now that the new avatar is saved, remove the one it replaces.
  const oldId = current.avatarUrl && avatarPublicId(current.avatarUrl, profileId);
  if (oldId) await deleteQuietly(oldId);

  return { avatarUrl: uploaded.url };
}
