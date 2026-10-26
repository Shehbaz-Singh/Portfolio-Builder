import Link from 'next/link';
import { AppTestimonials } from '@/components/auth/AppTestimonials';

// The form, with a strip of what people say about the app below it.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-16 px-6 py-12"
    >
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-8 block text-sm font-semibold tracking-wide text-muted">
          Portfolio Generator
        </Link>
        {children}
      </div>
      <AppTestimonials />
    </main>
  );
}
