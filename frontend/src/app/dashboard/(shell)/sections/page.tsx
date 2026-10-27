import type { Metadata } from 'next';
import { SectionsStep } from '@/components/dashboard/steps/SectionsStep';

export const metadata: Metadata = { title: 'Sections' };

export default function Page() {
  return (
    <>
      <h1 className="type-page mb-4">Sections</h1>
      <SectionsStep />
    </>
  );
}
