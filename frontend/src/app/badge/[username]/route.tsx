import { badgeImage } from '@/components/portfolio/badge-image';

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return badgeImage(username);
}
