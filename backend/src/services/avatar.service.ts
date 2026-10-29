import { avatarPublicId, deleteImagesOf, uploadAvatar } from '../lib/cloudinary';
import { deleteImageQuietly, replaceImage } from '../lib/image-lifecycle';
import { ownProfile } from '../lib/profile';
import { prisma } from '../lib/prisma';

// Removes the Cloudinary file behind an avatar URL, but only if it is one of this profile's own.
export async function deleteAvatarImage(avatarUrl: string | null, profileId: string) {
  const publicId = avatarUrl && avatarPublicId(avatarUrl, profileId);
  if (publicId) await deleteImageQuietly(publicId, 'a Cloudinary image');
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
  const uploaded = await replaceImage({
    file,
    load: () => ownProfile(profileId, { avatarUrl: true }),
    upload: () => uploadAvatar(file, profileId),
    save: (image) =>
      prisma.profile.update({ where: { id: profileId }, data: { avatarUrl: image.url } }),
    discardNew: (image) => deleteImageQuietly(image.publicId, 'a Cloudinary image'),
    // Only now that the new avatar is saved, remove the one it replaces.
    discardOld: (current) => deleteAvatarImage(current.avatarUrl, profileId),
  });
  return { avatarUrl: uploaded.url };
}

// Safe to repeat: with no avatar there is nothing to do. The profile is cleared first, so a
// failed Cloudinary delete can only leave an unused image behind, never a broken avatar.
export async function removeAvatar(profileId: string) {
  const current = await ownProfile(profileId, { avatarUrl: true });
  if (!current.avatarUrl) return;

  await prisma.profile.update({ where: { id: profileId }, data: { avatarUrl: null } });

  await deleteAvatarImage(current.avatarUrl, profileId);
}
