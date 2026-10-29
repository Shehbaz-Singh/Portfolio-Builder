import { ImageResponse } from 'next/og';
import { DEFAULT_ACCENT } from '@parichay/shared';
import { getPublicProfile } from '@/lib/api';
import { normalizeHex, readableTextOn } from '@/lib/color';
import { SITE_URL } from '@/lib/config';
import { truncate } from '@/lib/format';
import { pagePath } from '@/lib/i18n';

// The badge an email signature can carry: a small card that names the page and its address. It is
// drawn at 480 by 128 pixels and shown at 240 by 64, so it stays sharp on high-density screens. It
// only uses the address (Latin letters and digits), never the person's own text, so it draws the
// same for every language. A page that is not public has no badge.
const size = { width: 480, height: 128 };
// The wide strip (Banner style): twice the width, the same height, shown at 480 by 64.
const wideSize = { width: 960, height: 128 };

export async function badgeImage(username: string, locale?: string, wide = false) {
  const profile = await getPublicProfile(username, locale);
  if (!profile) return new Response('Not found', { status: 404 });
  if (locale && locale !== profile.defaultLocale && !profile.locales.includes(locale)) {
    return new Response('Not found', { status: 404 });
  }

  const accent = normalizeHex(profile.accentColor) ?? DEFAULT_ACCENT;
  const path = pagePath(profile.slug, profile.locale, profile.defaultLocale);
  const host = new URL(SITE_URL).host;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        background: '#0f172a',
        borderRadius: 20,
        color: 'white',
      }}
    >
      <div
        style={{
          width: 128,
          height: 128,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: accent,
          color: readableTextOn(accent),
          fontSize: 64,
          fontWeight: 700,
          borderRadius: '20px 0 0 20px',
        }}
      >
        {profile.slug.charAt(0).toUpperCase()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 28, flex: 1 }}>
        <div style={{ fontSize: 22, color: '#cbd5e1' }}>View my portfolio</div>
        <div style={{ fontSize: 32, fontWeight: 700, marginTop: 2 }}>{truncate(path, 17)}</div>
        {!wide && (
          <div style={{ fontSize: 22, color: '#94a3b8', marginTop: 2 }}>{truncate(host, 28)}</div>
        )}
      </div>
      {wide && (
        <div style={{ fontSize: 30, color: '#94a3b8', marginRight: 36 }}>{truncate(host, 32)}</div>
      )}
    </div>,
    {
      ...(wide ? wideSize : size),
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
