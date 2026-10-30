import { unstable_cache } from 'next/cache';
import { buildVCard, contactCardInput, isLocaleCode, vcardDisposition } from '@parichay/shared';
import { PUBLIC_PROFILES_TAG, getPublicProfile } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { fill, pagePath, uiFor } from '@/lib/i18n';
import { clientIp, createLimiter, tooManyRequests } from '@/lib/public-rate-limit';

export const runtime = 'nodejs';

// GET /<username>/contact.vcf[?lang=hi]: a vCard 3.0 contact card made from the published page's
// public data, so it holds only what the owner shows: links they have hidden never reach it. A page
// that is unpublished, missing, a sample, or has the card switched off gives the same plain 404.
// `lang` is one of the page's extra languages: the title and the note are then in that language
// (the name is not translated).
//
// Caching: the response may sit a minute in a shared cache and is revalidated after that. The
// profile itself comes from the same tagged data cache as the page, which saving anything clears at
// once, so an edit shows in the next file. The photo is kept for an hour, under the same tag.

// The profile photo as a small square JPEG in base64, or null. About 200 px and at most 30 KB: a
// card is read by contacts apps that store the picture, and a big one only slows the import. Only our
// own Cloudinary https images are fetched (the address is stored data, and must not let the server be
// aimed at internal addresses). Any failure means no photo; the card never links to one, because
// Apple Contacts and Outlook ignore a linked picture.
const PHOTO_MAX_BYTES = 30_000;
const PHOTO_SIZE = 200;

const loadPhoto = unstable_cache(
  async (avatarUrl: string): Promise<string | null> => {
    try {
      const url = new URL(avatarUrl);
      if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return null;
      // Ask for lower quality until it fits.
      for (const quality of [70, 50, 35]) {
        const small = avatarUrl.replace(
          '/image/upload/',
          `/image/upload/c_fill,g_face,w_${PHOTO_SIZE},h_${PHOTO_SIZE},f_jpg,q_${quality}/`,
        );
        const res = await fetch(small, { signal: AbortSignal.timeout(4000) });
        if (!res.ok || !res.headers.get('content-type')?.startsWith('image/jpeg')) return null;
        const bytes = Buffer.from(await res.arrayBuffer());
        if (bytes.length <= PHOTO_MAX_BYTES) return bytes.toString('base64');
      }
      return null;
    } catch {
      return null;
    }
  },
  ['contact-photo', '1'],
  { revalidate: 3600, tags: [PUBLIC_PROFILES_TAG] },
);

const limited = createLimiter(60_000, 20);
const notFound = () => new Response('Not found', { status: 404 });

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const wait = limited(clientIp(req));
  if (wait > 0) return tooManyRequests(wait);

  const { username } = await params;
  const lang = new URL(req.url).searchParams.get('lang');
  if (lang !== null && !isLocaleCode(lang)) return notFound();

  const profile = await getPublicProfile(username, lang ?? undefined);
  if (!profile || !profile.contactCardEnabled || profile.isSample) return notFound();

  const url = `${SITE_URL}${pagePath(profile.slug, profile.locale, profile.defaultLocale)}`;
  const photo =
    profile.contactCardPhoto && profile.avatarUrl ? await loadPhoto(profile.avatarUrl) : null;
  const card = buildVCard({
    ...contactCardInput(profile, {
      portfolioUrl: url,
      note: fill(uiFor(profile.locale).contact.note, { url }),
      photoJpegBase64: photo,
    }),
    // One identity for every language of the page, so saving it again updates the same contact.
    uid: `${SITE_URL}/${profile.slug}`,
  });

  return new Response(card, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': vcardDisposition(profile.fullName, profile.slug),
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
