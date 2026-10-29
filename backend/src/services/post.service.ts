import { MAX_POSTS, type PostInput } from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';
import { coverPublicId, deleteImage, uploadCover } from '../lib/cloudinary';
import { AppError } from '../lib/errors';
import { detectImageType } from '../lib/image';
import { WAIT, lockProfile } from '../lib/locks';
import { prisma } from '../lib/prisma';
import { orNotFound } from '../lib/prisma-errors';
import { myPostSummaries } from '../lib/selects';
import { slugifyTitle } from '../lib/slug';
import { deleteTranslationsFor } from './translation.service';
import { ERRORS } from '../lib/messages';

// Posts and links in the Writing section. Ownership: a post is always looked up by (id, profileId),
// so one that belongs to someone else looks exactly like one that does not exist (404).

const notFound = () => AppError.notFound(ERRORS.postNotFound);

const own = { omit: { profileId: true } } satisfies Prisma.PostFindManyArgs;

export const listPosts = (profileId: string) =>
  prisma.post.findMany({ where: { profileId }, ...myPostSummaries });

export async function getPost(profileId: string, id: string) {
  const post = await prisma.post.findFirst({ where: { id, profileId }, ...own });
  if (!post) throw notFound();
  return post;
}

// "my-title", then "my-title-2", ... within this profile. One query loads the slugs that start with
// the base; the unique index on (profileId, slug) is the real guard against two at once, and the
// profile lock held by the caller keeps those from happening.
async function uniqueSlug(tx: Prisma.TransactionClient, profileId: string, title: string) {
  const base = slugifyTitle(title);
  const rows = await tx.post.findMany({
    where: { profileId, slug: { startsWith: base } },
    select: { slug: true },
  });
  const taken = new Set(rows.map((row) => row.slug));
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

// Publishing sets the date the first time. Going back to a draft keeps it, so publishing again does
// not make an old post look new.
const publishedAtFor = (input: PostInput, current: Date | null) =>
  input.status === 'published' ? (current ?? new Date()) : current;

export function createPost(profileId: string, input: PostInput) {
  return prisma.$transaction(async (tx) => {
    await lockProfile(tx, profileId);
    const count = await tx.post.count({ where: { profileId } });
    if (count >= MAX_POSTS) {
      throw AppError.conflict('LIMIT_REACHED', ERRORS.maxPosts(MAX_POSTS));
    }
    return tx.post.create({
      data: {
        ...input,
        profileId,
        slug: await uniqueSlug(tx, profileId, input.title),
        publishedAt: publishedAtFor(input, null),
      },
      ...own,
    });
  }, WAIT);
}

export async function updatePost(profileId: string, id: string, input: PostInput) {
  const current = await prisma.post.findFirst({
    where: { id, profileId },
    select: { publishedAt: true },
  });
  if (!current) throw notFound();
  return orNotFound(
    prisma.post.update({
      where: { id, profileId },
      data: { ...input, publishedAt: publishedAtFor(input, current.publishedAt) },
      ...own,
    }),
    notFound,
  );
}

// Housekeeping: a failure only leaves an unused image behind, so it is logged (without any id) and
// never fails the request.
async function deleteCoverQuietly(url: string | null, profileId: string) {
  const publicId = url && coverPublicId(url, profileId);
  if (!publicId) return;
  try {
    await deleteImage(publicId);
  } catch (err) {
    console.warn(
      'Could not delete a post cover image:',
      err instanceof Error ? err.message : 'unknown error',
    );
  }
}

export async function deletePost(profileId: string, id: string) {
  const post = await prisma.post.findFirst({
    where: { id, profileId },
    select: { coverImageUrl: true },
  });
  if (!post) throw notFound();
  await orNotFound(prisma.post.delete({ where: { id, profileId } }), notFound);
  await prisma.$transaction((tx) => deleteTranslationsFor(tx, profileId, 'post', [id]));
  await deleteCoverQuietly(post.coverImageUrl, profileId);
}

export async function replaceCover(profileId: string, id: string, file: Buffer) {
  if (!detectImageType(file)) {
    throw new AppError(400, 'UNSUPPORTED_FILE_TYPE', ERRORS.imageTypes);
  }
  const post = await prisma.post.findFirst({
    where: { id, profileId },
    select: { coverImageUrl: true },
  });
  if (!post) throw notFound();

  let uploaded;
  try {
    uploaded = await uploadCover(file, profileId, id);
  } catch (err) {
    console.error(
      'Cloudinary upload failed:',
      err instanceof Error ? err.message : 'unknown error',
    );
    throw new AppError(502, 'UPLOAD_FAILED', ERRORS.imageUploadFailed);
  }

  try {
    await prisma.post.update({
      where: { id, profileId },
      data: { coverImageUrl: uploaded.url },
      select: { id: true },
    });
  } catch (err) {
    await deleteCoverQuietly(uploaded.url, profileId); // no post points to it
    throw err;
  }
  await deleteCoverQuietly(post.coverImageUrl, profileId); // the one it replaces
  return { coverImageUrl: uploaded.url };
}

// Safe to repeat: with no cover there is nothing to do. The post is cleared first, so a failed
// Cloudinary delete can only leave an unused image behind, never a broken cover.
export async function removeCover(profileId: string, id: string) {
  const post = await prisma.post.findFirst({
    where: { id, profileId },
    select: { coverImageUrl: true },
  });
  if (!post) throw notFound();
  if (!post.coverImageUrl) return;
  await prisma.post.update({
    where: { id, profileId },
    data: { coverImageUrl: null },
    select: { id: true },
  });
  await deleteCoverQuietly(post.coverImageUrl, profileId);
}
