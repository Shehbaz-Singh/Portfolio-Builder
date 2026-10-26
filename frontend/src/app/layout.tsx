import type { Metadata, Viewport } from 'next';
import { SITE_URL } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  // Base for the absolute URLs in Open Graph and canonical tags.
  metadataBase: new URL(SITE_URL),
  title: 'Portfolio Generator',
  description: 'Build and publish your portfolio page.',
};

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#ffffff' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="theme-root min-h-screen antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
