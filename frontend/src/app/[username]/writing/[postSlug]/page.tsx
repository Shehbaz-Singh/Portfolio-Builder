import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { ShareButton } from '@/components/ShareButton';
import { Avatar, NewTabLink } from '@/components/themes/parts';
import { WritingShell } from '@/components/writing/WritingShell';
import { getPublicPost, getPublicProfile } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { formatDate, initials, safeHttpUrl, truncate } from '@/lib/format';

type Props = { params: Promise<{ username: string; postSlug: string }> };

// About 200 words a minute, and never less than one.
const readingMinutes = (text: string) =>
  Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));

// The title, summary and share image (./opengraph-image.tsx, which uses the cover when there is one).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, postSlug } = await params;
  const [profile, post] = await Promise.all([
    getPublicProfile(username),
    getPublicPost(username, postSlug),
  ]);
  if (!profile || !post) notFound();
  const title = `${post.title} | ${profile.fullName}`;
  const description = truncate(post.excerpt ?? post.body ?? post.title, 160);
  const url = `/${profile.slug}/writing/${post.slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [profile.fullName],
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// One published post. A draft, a missing post and a hidden Writing section all give the same 404.
export default async function PostPage({ params }: Props) {
  const { username, postSlug } = await params;
  const [profile, post] = await Promise.all([
    getPublicProfile(username),
    getPublicPost(username, postSlug),
  ]);
  if (!profile || !post) notFound();
  if (profile.slug !== username) permanentRedirect(`/${profile.slug}/writing/${post.slug}`);

  const cover = safeHttpUrl(post.coverImageUrl);
  const external = safeHttpUrl(post.externalUrl);
  const hasBody = post.type === 'post' && !!post.body;
  const url = `${SITE_URL}/${profile.slug}/writing/${post.slug}`;

  // Article structured data. The text comes from the owner, so "<" is escaped: nothing in it can end
  // the script element.
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: url,
    image: cover ? [cover] : undefined,
    author: { '@type': 'Person', name: profile.fullName, url: `${SITE_URL}/${profile.slug}` },
  }).replace(/</g, '\\u003c');

  return (
    <WritingShell profile={profile}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <Link
        href={`/${profile.slug}/writing`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-fg underline underline-offset-2 hover:no-underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to all writing
      </Link>
      <article className="mt-6">
        <h1 className="wr-display type-page text-balance [overflow-wrap:anywhere]">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/${profile.slug}`}
            className="flex min-w-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg"
          >
            <Avatar
              avatar={{
                src: safeHttpUrl(profile.avatarUrl),
                alt: '', // the name beside it says whose it is
                initials: initials(profile.fullName),
              }}
              className="size-10 shrink-0 rounded-full"
              placeholderClassName="bg-accent-soft text-sm font-semibold text-accent-fg"
            />
            <span className="min-w-0">
              <span className="block truncate font-semibold hover:underline">
                {profile.fullName}
              </span>
              <span className="block text-sm text-muted">
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                {hasBody && ` · ${readingMinutes(post.body ?? '')} min read`}
              </span>
            </span>
          </Link>
          <ShareButton url={url} title={post.title} variant="outline" />
        </div>
        {cover && (
          // A plain <img>: covers come from Cloudinary, already cropped to 1200 x 630. Decorative.
          <img
            src={cover}
            alt=""
            width={1200}
            height={630}
            className="mt-8 aspect-[40/21] w-full rounded-card object-cover"
          />
        )}
        {hasBody ? (
          // 65 characters or so a line is where reading is comfortable.
          <div className="mt-8 max-w-[68ch] text-lg leading-8">
            <Markdown>{post.body ?? ''}</Markdown>
          </div>
        ) : (
          <div className="mt-8 max-w-[68ch] space-y-4">
            {post.excerpt && <p className="text-lg leading-relaxed">{post.excerpt}</p>}
            {external && (
              <NewTabLink
                href={external}
                className="inline-flex items-center gap-2 font-semibold text-accent-fg underline underline-offset-2 hover:no-underline"
              >
                <ExternalLink aria-hidden="true" className="size-4" />
                Read the article
              </NewTabLink>
            )}
          </div>
        )}
      </article>
    </WritingShell>
  );
}
