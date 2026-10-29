import type { MetadataRoute } from 'next';
import { getSitemapLocales, getSitemapPosts } from '@/lib/api';
import { SITE_URL } from '@/lib/config';

// The pages that belong to the site itself, and the published posts that have a page of their own.
// Portfolio pages are public but personal, so they are not listed; a post is, because someone chose
// to publish it as something to read and find. Links to articles elsewhere have no page.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = [SITE_URL, `${SITE_URL}/register`, `${SITE_URL}/login`].map((url) => ({ url }));
  const [rows, offered] = await Promise.all([getSitemapPosts(), getSitemapLocales()]);
  const locales = new Map(offered.map((row) => [row.username, row.locales]));
  // A post has a page in the default language and in each language its owner offers; every entry
  // lists the others as alternates (hreflang), so search engines pair them.
  const posts = rows.map(({ username, postSlug, updatedAt }) => {
    const extra = locales.get(username) ?? [];
    const path = `${SITE_URL}/${username}/writing/${postSlug}`;
    const versions = [
      path,
      ...extra.map((code) => `${SITE_URL}/${username}/${code}/writing/${postSlug}`),
    ];
    return {
      url: path,
      lastModified: new Date(updatedAt),
      ...(extra.length > 0 && {
        alternates: {
          languages: Object.fromEntries(extra.map((code, i) => [code, versions[i + 1]])),
        },
      }),
    };
  });
  const localized = rows.flatMap(({ username, postSlug, updatedAt }) =>
    (locales.get(username) ?? []).map((code) => ({
      url: `${SITE_URL}/${username}/${code}/writing/${postSlug}`,
      lastModified: new Date(updatedAt),
    })),
  );
  return [...site, ...posts, ...localized];
}
