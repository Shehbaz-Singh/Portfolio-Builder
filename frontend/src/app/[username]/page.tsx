import type { Metadata, Viewport } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPublicProfile } from '@/lib/api';
import { truncate } from '@/lib/format';
import { getTheme } from '@/lib/themes';

type Props = { params: Promise<{ username: string }> };

// A Server Component: the profile is fetched on the server, so visitors and crawlers get
// finished HTML. getPublicProfile is cached per request, so the fetch below is shared with
// the page itself and the OG image.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const title = profile.tagline ? `${profile.fullName} | ${profile.tagline}` : profile.fullName;
  const description = truncate(
    profile.about ?? profile.tagline ?? `${profile.fullName}'s portfolio`,
    160,
  );
  const url = `/${profile.slug}`; // resolved against metadataBase in the root layout

  return {
    title,
    description,
    alternates: { canonical: url },
    // og:image comes from ./opengraph-image.tsx automatically.
    openGraph: { type: 'profile', title, description, url, username: profile.slug },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// The browser's own chrome (address bar on a phone, form controls, scrollbars) follows the
// profile's theme, so a dark theme is dark all the way to the edge.
export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) return {};
  const { scheme, background } = getTheme(profile.theme);
  return { colorScheme: scheme, themeColor: background };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  // /JANE-DOE and /jane-doe are the same profile: keep one canonical URL.
  if (profile.slug !== username) permanentRedirect(`/${profile.slug}`);

  const { Component: Theme } = getTheme(profile.theme);
  return <Theme profile={profile} />;
}
