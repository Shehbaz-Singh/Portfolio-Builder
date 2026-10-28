import type { MetadataRoute } from 'next';
import { getSitemapPosts } from '@/lib/api';
import { SITE_URL } from '@/lib/config';

// The pages that belong to the site itself, and the published posts that have a page of their own.
// Portfolio pages are public but personal, so they are not listed; a post is, because someone chose
// to publish it as something to read and find. Links to articles elsewhere have no page.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = [SITE_URL, `${SITE_URL}/register`, `${SITE_URL}/login`].map((url) => ({ url }));
  const posts = (await getSitemapPosts()).map(({ username, postSlug, updatedAt }) => ({
    url: `${SITE_URL}/${username}/writing/${postSlug}`,
    lastModified: new Date(updatedAt),
  }));
  return [...site, ...posts];
}
