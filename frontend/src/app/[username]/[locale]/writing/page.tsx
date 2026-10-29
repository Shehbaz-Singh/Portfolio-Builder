import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocaleCode } from '@parichay/shared';
import { WritingListView, writingListMetadata } from '@/components/portfolio/writing-pages';

type Props = { params: Promise<{ username: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, locale } = await params;
  if (!isLocaleCode(locale)) notFound();
  return writingListMetadata(username, locale);
}

export default async function LocaleWritingPage({ params }: Props) {
  const { username, locale } = await params;
  if (!isLocaleCode(locale)) notFound();
  return <WritingListView username={username} locale={locale} />;
}
