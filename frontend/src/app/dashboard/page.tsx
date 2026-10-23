import type { Metadata } from 'next';
import { Editor } from '@/components/dashboard/Editor';

export const metadata: Metadata = {
  title: 'Dashboard | Portfolio Generator',
  robots: { index: false },
};

// The editor loads the profile in the browser, through the /api proxy. That way a sleeping
// free-tier API shows a friendly waiting screen with retry instead of a blank page that is
// still loading on the server. The route guard (src/proxy.ts) keeps signed-out users out.
export default function DashboardPage() {
  return <Editor />;
}
