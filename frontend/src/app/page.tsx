import Link from 'next/link';
import { buttonStyles } from '@/components/ui';

export default function HomePage() {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12"
    >
      <h1 className="type-hero">Portfolio Generator</h1>
      <p className="mt-3 text-lg text-muted">
        Fill in your details, pick a look, and get a portfolio page at your own link.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/register" className={buttonStyles({ variant: 'primary' })}>
          Create your portfolio
        </Link>
        <Link href="/login" className={buttonStyles()}>
          Log in
        </Link>
      </div>
    </main>
  );
}
