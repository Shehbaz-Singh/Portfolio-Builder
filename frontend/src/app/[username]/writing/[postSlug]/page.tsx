import type { Metadata } from 'next';
import { PostView, postMetadata } from '@/components/portfolio/writing-pages';

type Props = { params: Promise<{ username: string; postSlug: string }> };

// The title, summary and share image (./opengraph-image.tsx, which uses the cover when there is one).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, postSlug } = await params;
  return postMetadata(username, postSlug);
}

export default async function PostPage({ params }: Props) {
  const { username, postSlug } = await params;
  return <PostView username={username} postSlug={postSlug} />;
}
