import { profileCard } from '@/components/portfolio/profile-card';

export const alt = 'Portfolio preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  return profileCard((await params).username);
}
