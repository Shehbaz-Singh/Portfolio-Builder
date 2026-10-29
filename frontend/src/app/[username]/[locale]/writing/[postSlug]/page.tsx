import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocaleCode } from '@parichay/shared';
import { PostView, postMetadata } from '@/components/portfolio/writing-pages';

type Props = { params: Promise<{ username: string; locale: string; postSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, locale, postSlug } = await params;
  if (!isLocaleCode(locale)) notFound();
  return postMetadata(username, postSlug, locale);
}

export default async function LocalePostPage({ params }: Props) {
  const { username, locale, postSlug } = await params;
  if (!isLocaleCode(locale)) notFound();
  return <PostView username={username} postSlug={postSlug} locale={locale} />;
}
