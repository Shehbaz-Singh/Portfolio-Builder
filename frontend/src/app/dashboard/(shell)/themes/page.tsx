import type { Metadata } from 'next';
import { ThemesPage } from '@/components/dashboard/ThemesPage';

export const metadata: Metadata = { title: 'Themes | Portfolio Generator' };

export default function Page() {
  return (
    <>
      <h1 className="type-page mb-4">Themes</h1>
      <ThemesPage />
    </>
  );
}
