import type { Metadata } from 'next';
import { LegalPage } from '@/components/landing/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy',
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <p>
        The privacy policy will go here. In the meantime, in short: the details you put on your
        portfolio are shown on your public page once you publish it, you can delete your account at
        any time, and a resume PDF you upload for import is not stored.
      </p>
    </LegalPage>
  );
}
