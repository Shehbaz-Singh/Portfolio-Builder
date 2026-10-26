import Link from 'next/link';

// Shown for a missing slug and for an unpublished profile alike: visitors cannot tell the two
// apart, which is deliberate.
export default function ProfileNotFound() {
  return (
    <main
      id="main"
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <p className="text-sm font-semibold tracking-wider text-accent uppercase">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Portfolio not found</h1>
      <p className="mt-3 max-w-md text-muted">
        This page doesn&apos;t exist, or its owner hasn&apos;t published it yet.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-line px-5 py-2 text-sm font-medium transition hover:bg-surface"
      >
        Back to home
      </Link>
    </main>
  );
}
