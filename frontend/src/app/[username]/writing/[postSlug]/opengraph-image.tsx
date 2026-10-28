import { ImageResponse } from 'next/og';
import { getPublicPost, getPublicProfile } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { truncate } from '@/lib/format';

export const alt = 'Post preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The cover is a Cloudinary address, but the field could in principle hold anything, and fetching
// it from our server would let someone aim the server at internal addresses (SSRF). So only our
// own Cloudinary https images are fetched, and any failure falls back to the plain card: this
// must always render. Satori cannot decode WebP, so Cloudinary is asked for a PNG at the right size.
async function loadCover(coverUrl: string | null): Promise<string | null> {
  if (!coverUrl) return null;
  try {
    const url = new URL(coverUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return null;
    const png = coverUrl.replace('/image/upload/', '/image/upload/f_png,w_1200,h_630,c_fill/');
    const res = await fetch(png, { signal: AbortSignal.timeout(4000), next: { revalidate: 3600 } });
    if (!res.ok || !res.headers.get('content-type')?.startsWith('image/png')) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > 2_000_000) return null;
    return `data:image/png;base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ username: string; postSlug: string }>;
}) {
  const { username, postSlug } = await params;
  const [profile, post] = await Promise.all([
    getPublicProfile(username),
    getPublicPost(username, postSlug),
  ]);
  if (!profile || !post) return new Response('Not found', { status: 404 });

  const cover = await loadCover(post.coverImageUrl);
  const host = new URL(SITE_URL).host;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 72,
        color: 'white',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #312e81 100%)',
        position: 'relative',
      }}
    >
      {cover && (
        <>
          <img
            alt=""
            src={cover}
            width={1200}
            height={630}
            style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630 }}
          />
          {/* A dark wash so the words stay readable on any picture. */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              background: 'linear-gradient(0deg, rgba(8,12,24,0.92) 0%, rgba(8,12,24,0.35) 70%)',
            }}
          />
        </>
      )}
      <div
        style={{
          display: 'flex',
          fontSize: 68,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: -1,
          position: 'relative',
        }}
      >
        {truncate(post.title, 110)}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 36,
          fontSize: 32,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', fontWeight: 600 }}>{truncate(profile.fullName, 48)}</div>
        <div style={{ display: 'flex', opacity: 0.75 }}>{host}</div>
      </div>
    </div>,
    size,
  );
}
