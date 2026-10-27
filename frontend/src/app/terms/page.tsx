import type { Metadata } from 'next';
import { LegalPage } from '@/components/landing/LegalPage';

export const metadata: Metadata = {
  title: 'Terms',
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms">
      <p>The terms of use will go here.</p>
    </LegalPage>
  );
}
