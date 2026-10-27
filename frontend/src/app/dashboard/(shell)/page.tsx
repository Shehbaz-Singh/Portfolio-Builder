import type { Metadata } from 'next';
import { Greeting } from '@/components/dashboard/Greeting';
import { ProfilePage } from '@/components/dashboard/ProfilePage';

export const metadata: Metadata = { title: 'Profile' };

export default function Page() {
  return (
    <>
      <Greeting />
      <ProfilePage />
    </>
  );
}
