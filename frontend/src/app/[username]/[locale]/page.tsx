import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { isLocaleCode } from '@parichay/shared';
import { ProfileView, profileMetadata, profileViewport } from '@/components/portfolio/profile-page';

type Props = { params: Promise<{ username: string; locale: string }> };

// A portfolio in one of its other languages. A code that is not a language, a language the owner
// has not added, and one whose translation is not ready are the same 404 (the API decides).
async function localeOf(params: Props['params']) {
  const { username, locale } = await params;
  if (!isLocaleCode(locale)) notFound();
  return { username, locale };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, locale } = await localeOf(params);
  return profileMetadata(username, locale);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { username, locale } = await localeOf(params);
  return profileViewport(username, locale);
}

export default async function LocaleProfilePage({ params }: Props) {
  const { username, locale } = await localeOf(params);
  return <ProfileView username={username} locale={locale} />;
}
