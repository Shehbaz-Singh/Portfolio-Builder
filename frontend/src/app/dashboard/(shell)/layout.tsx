import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export const metadata: Metadata = {
  title: 'Dashboard | Portfolio Generator',
  robots: { index: false },
};

// Every dashboard page except the preview frame shares this: the sidebar, the top bar and the
// profile being edited stay in place while the page in the middle changes.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
