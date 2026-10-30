import { unstable_cache } from 'next/cache';
import { renderToBuffer } from '@react-pdf/renderer';
import type { PublicProfile } from '@parichay/shared';
import { PUBLIC_PROFILES_TAG, getPublicProfile } from '@/lib/api';
import { clientIp, createLimiter, tooManyRequests } from '@/lib/public-rate-limit';
import { ResumeDocument } from '@/lib/resume-pdf';

export const runtime = 'nodejs';

// GET /<username>/resume.pdf: a resume made from the published page's public data. A page that is
// unpublished, missing, or has the download switched off gives the same plain 404.
//
// Caching: the generated file is kept for five minutes in the data cache, keyed by the profile's
// content (so an edit makes a new file) and tagged like the profile itself (so saving anything
// clears it at once). The response may sit a minute longer in a shared cache.
// The profile photo as a small JPEG, or null. Only our own Cloudinary https images are fetched (the
// address is stored data, and must not let the server be aimed at internal addresses); the picture
// is asked for as a 240 px square JPEG, which is what the PDF library can draw. Any failure means no
// photo: the resume then shows initials, as the page does.
async function loadPhoto(avatarUrl: string | null): Promise<Buffer | null> {
  if (!avatarUrl) return null;
  try {
    const url = new URL(avatarUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return null;
    const jpg = avatarUrl.replace(
      '/image/upload/',
      '/image/upload/f_jpg,w_240,h_240,c_fill,g_face/',
    );
    const res = await fetch(jpg, { signal: AbortSignal.timeout(4000) });
    if (!res.ok || !res.headers.get('content-type')?.startsWith('image/jpeg')) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length > 1_000_000 ? null : bytes;
  } catch {
    return null;
  }
}

const RESUME_LAYOUT_VERSION = '2';

const renderResume = unstable_cache(
  async (profile: PublicProfile) => {
    const photo = await loadPhoto(profile.avatarUrl);
    const pdf = await renderToBuffer(<ResumeDocument profile={profile} photo={photo} />);
    return pdf.toString('base64');
  },
  // Bump the version when the layout code changes, so files made by the old layout are not served.
  ['resume-pdf', RESUME_LAYOUT_VERSION],
  { revalidate: 300, tags: [PUBLIC_PROFILES_TAG] },
);

const limited = createLimiter(60_000, 20);

// "Jane Q. Doe" -> "jane-q-doe-resume.pdf". ASCII only, so every browser saves it as written;
// a name with no Latin letters falls back to the page address.
function fileName(profile: PublicProfile): string {
  const base = profile.fullName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || profile.slug}-resume.pdf`;
}

const notFound = () => new Response('Not found', { status: 404 });

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const wait = limited(clientIp(req));
  if (wait > 0) return tooManyRequests(wait);

  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile || !profile.resumeEnabled) return notFound();

  const pdf = Buffer.from(await renderResume(profile), 'base64');
  // ?view=1 shows it in the browser (the dashboard's preview); otherwise it downloads.
  const inline = new URL(req.url).searchParams.has('view');
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.length),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${fileName(profile)}"`,
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60',
    },
  });
}
