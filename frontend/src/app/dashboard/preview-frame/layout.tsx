import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Preview | Portfolio Generator',
  robots: { index: false },
};

export default function PreviewFrameLayout({ children }: { children: ReactNode }) {
  return children;
}
