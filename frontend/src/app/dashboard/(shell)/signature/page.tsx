import type { Metadata } from 'next';
import { SignatureGenerator } from '@/components/dashboard/SignatureGenerator';

export const metadata: Metadata = { title: 'Email signature' };

export default function Page() {
  return (
    <>
      <h1 className="type-page mb-4">Email signature</h1>
      <SignatureGenerator />
    </>
  );
}
