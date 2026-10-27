import type { Metadata } from 'next';
import { AccountSettings } from '@/components/dashboard/AccountSettings';

export const metadata: Metadata = {
  title: 'Account settings | Portfolio Generator',
};

// Guarded like the rest of /dashboard by src/proxy.ts.
export default function SettingsPage() {
  return <AccountSettings />;
}
