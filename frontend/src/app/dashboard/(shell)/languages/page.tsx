import type { Metadata } from 'next';
import { LanguagesStep } from '@/components/dashboard/steps/LanguagesStep';

export const metadata: Metadata = { title: 'Languages' };

export default function Page() {
  return (
    <>
      <h1 className="type-page mb-4">Languages</h1>
      <LanguagesStep />
    </>
  );
}
