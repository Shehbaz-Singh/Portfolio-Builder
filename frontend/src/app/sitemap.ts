import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

// Only the pages that belong to the site itself. Portfolio pages are public but personal, so they
// are not listed here.
export default function sitemap(): MetadataRoute.Sitemap {
  return [SITE_URL, `${SITE_URL}/register`, `${SITE_URL}/login`].map((url) => ({ url }));
}
