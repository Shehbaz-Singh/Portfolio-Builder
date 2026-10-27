import type { Metadata } from 'next';
import { ProfilePage } from '@/components/dashboard/ProfilePage';

export const metadata: Metadata = { title: 'Profile | Portfolio Generator' };

export default function Page() {
  return (
    <>
      <h1 className="type-page mb-4">Profile</h1>
      <ProfilePage />
    </>
  );
}
