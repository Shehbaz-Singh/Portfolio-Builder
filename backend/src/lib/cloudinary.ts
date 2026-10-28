import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true,
});

const AVATAR_FOLDER = 'portfolio/avatars';
const AVATAR_SIZE = 400;

export interface UploadedImage {
  url: string;
  publicId: string;
}

// Square crop (centred on the most interesting part of the image) resized to 400x400.
// Every upload gets a fresh public id, so a replaced avatar also gets a fresh URL and no
// CDN or browser keeps showing the old picture. The profile id in the name is what lets
// avatarPublicId() later prove an image belongs to a given profile.
export function uploadAvatar(buffer: Buffer, profileId: string): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: `${AVATAR_FOLDER}/${profileId}-${Date.now()}`,
          resource_type: 'image',
          allowed_formats: ['jpg', 'png', 'webp'],
          transformation: [
            {
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              crop: 'fill',
              gravity: 'auto',
              quality: 'auto',
            },
          ],
        },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error('Cloudinary returned no result'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      )
      .end(buffer);
  });
}

// Returns the Cloudinary public id of `url` only if it is one of this profile's own avatars.
// avatarUrl can also be set through PUT /profile/me, so it may point anywhere, including at
// another user's image. Anything that is not ours is never deleted.
export function avatarPublicId(url: string, profileId: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== 'res.cloudinary.com') return null;

  // /<cloud name>/image/upload/v1700000000/portfolio/avatars/<profileId>-123.jpg
  const match = parsed.pathname.match(/^\/([^/]+)\/image\/upload\/v\d+\/(.+)\.[a-z0-9]+$/i);
  if (!match || match[1] !== config.CLOUDINARY_CLOUD_NAME) return null;

  const publicId = match[2];
  return publicId.startsWith(`${AVATAR_FOLDER}/${profileId}-`) ? publicId : null;
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
}

// Removes every image stored under a profile, including any left behind by an earlier failed delete.
// Used when the account is deleted. Names carry the profile id (see uploadAvatar), so this cannot
// touch anyone else's images.
export async function deleteImagesOf(profileId: string): Promise<void> {
  await cloudinary.api.delete_resources_by_prefix(`${AVATAR_FOLDER}/${profileId}-`, {
    resource_type: 'image',
    invalidate: true,
  });
}
