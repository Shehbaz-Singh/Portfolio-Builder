import type { Metadata } from 'next';
import { TestimonialsStep } from '@/components/dashboard/steps/TestimonialsStep';

export const metadata: Metadata = { title: 'Testimonials' };

export default function Page() {
  return (
    <>
      <h1 className="type-page mb-4">Testimonials</h1>
      <TestimonialsStep />
    </>
  );
}
