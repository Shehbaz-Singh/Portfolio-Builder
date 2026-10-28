import { AppError } from '../lib/errors';
import { avatarPublicId, deleteImage, deleteImagesOf, uploadAvatar } from '../lib/cloudinary';
import { detectImageType } from '../lib/image';
import { prisma } from '../lib/prisma';

// Deleting is housekeeping: a failure only leaves an unused image behind, so it is logged
// and never fails the request.
async function deleteQuietly(publicId: string) {
  try {
    await deleteImage(publicId);
  } catch (err) {
    // No id in the message: the log should not say whose image it was.
    console.warn(
      'Could not delete a Cloudinary image:',
      err instanceof Error ? err.message : 'unknown error',
    );
  }
}

// Removes the Cloudinary file behind an avatar URL, but only if it is one of this profile's own.
export async function deleteAvatarImage(avatarUrl: string | null, profileId: string) {
  const publicId = avatarUrl && avatarPublicId(avatarUrl, profileId);
  if (publicId) await deleteQuietly(publicId);
}

// For a deleted account: the current avatar, then anything else stored under the profile.
export async function deleteAllImagesOf(avatarUrl: string | null, profileId: string) {
  await deleteAvatarImage(avatarUrl, profileId);
  try {
    await deleteImagesOf(profileId);
  } catch (err) {
    console.warn(
      'Could not clear a deleted account’s images:',
      err instanceof Error ? err.message : 'unknown error',
    );
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
  await deleteAvatarImage(current.avatarUrl, profileId);

  return { avatarUrl: uploaded.url };
}

// Safe to repeat: with no avatar there is nothing to do. The profile is cleared first, so a
// failed Cloudinary delete can only leave an unused image behind, never a broken avatar.
export async function removeAvatar(profileId: string) {
  const current = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { avatarUrl: true },
  });
  if (!current) throw AppError.notFound('Profile not found');
  if (!current.avatarUrl) return;

  await prisma.profile.update({ where: { id: profileId }, data: { avatarUrl: null } });

  await deleteAvatarImage(current.avatarUrl, profileId);
}
