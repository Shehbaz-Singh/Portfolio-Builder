import type { Metadata, Viewport } from 'next';
import { ProfileView, profileMetadata, profileViewport } from '@/components/portfolio/profile-page';

type Props = { params: Promise<{ username: string }> };

// A Server Component: the profile is fetched on the server, so visitors and crawlers get
// finished HTML. This is the profile's default language; the others are in ./[locale].
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return profileMetadata((await params).username);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  return profileViewport((await params).username);
}

export default async function ProfilePage({ params }: Props) {
  return <ProfileView username={(await params).username} />;
}
