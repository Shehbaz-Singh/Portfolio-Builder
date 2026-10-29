import type { Metadata } from 'next';
import { WritingListView, writingListMetadata } from '@/components/portfolio/writing-pages';

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return writingListMetadata((await params).username);
}

export default async function WritingPage({ params }: Props) {
  return <WritingListView username={(await params).username} />;
}
