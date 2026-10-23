import { cache } from 'react';
import { publicProfileSchema, type PublicProfile } from '@portfolio/shared';
import { API_URL } from './config';

// Matches the backend's own one-minute cache: edits appear within about a minute.
const REVALIDATE_SECONDS = 60;

// The published profile for a slug, or null when there is none (missing or unpublished: the
// API gives the same 404 for both). Any other failure throws, so the error page shows
// instead of a misleading "not found". The response is validated against the shared schema.
// cache() means the page, generateMetadata and the OG image share one fetch per request.
export const getPublicProfile = cache(async (slug: string): Promise<PublicProfile | null> => {
  const res = await fetch(`${API_URL}/public/${encodeURIComponent(slug)}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Public profile API responded with ${res.status}`);
  return publicProfileSchema.parse(await res.json());
});
