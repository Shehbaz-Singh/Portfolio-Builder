import { isLocaleCode } from '@parichay/shared';
import { badgeImage } from '@/components/portfolio/badge-image';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string; locale: string }> },
) {
  const { username, locale } = await params;
  if (!isLocaleCode(locale)) return new Response('Not found', { status: 404 });
  return badgeImage(username, locale);
}
