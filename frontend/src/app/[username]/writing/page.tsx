import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPublicPosts, getPublicProfile } from '@/lib/api';
import { writingEntries } from '@/components/themes/blocks';
import { WritingList } from '@/components/themes/parts';
import { WritingShell } from '@/components/writing/WritingShell';

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();
  const title = `Writing | ${profile.fullName}`;
  return {
    title: { absolute: title },
    description: `Posts and articles by ${profile.fullName}.`,
    alternates: { canonical: `/${profile.slug}/writing` },
  };
}

// Every published post, newest first. Not found when the profile is unpublished or the owner has
// the Writing section switched off: hidden means hidden here too.
export default async function WritingPage({ params }: Props) {
  const { username } = await params;
  const [profile, posts] = await Promise.all([
    getPublicProfile(username),
    getPublicPosts(username),
  ]);
  if (!profile || !posts) notFound();
  if (profile.slug !== username) permanentRedirect(`/${profile.slug}/writing`);

  const entries = writingEntries(profile.slug, posts);
  return (
    <WritingShell profile={profile}>
      <h1 className="wr-display type-page">Writing</h1>
      <p className="mt-1 text-muted">Posts and articles by {profile.fullName}.</p>
      <div className="mt-10">
        {entries.length > 0 ? (
          <WritingList
            block={{
              kind: 'writing',
              id: 'writing',
              title: 'Writing',
              more: false,
              allHref: `/${profile.slug}/writing`,
              posts: entries,
            }}
            className="space-y-10"
            itemClassName="group relative min-w-0"
            coverClassName="mb-4 aspect-[40/21] w-full rounded-card object-cover"
            titleClassName="wr-display text-xl leading-snug font-semibold [overflow-wrap:anywhere] sm:text-2xl"
            linkClassName="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg group-hover:underline"
            metaClassName="mt-1 text-sm text-muted"
            excerptClassName="mt-2 leading-relaxed text-muted"
          />
        ) : (
          <p className="text-muted">Nothing here yet. Check back soon.</p>
        )}
      </div>
    </WritingShell>
  );
}
