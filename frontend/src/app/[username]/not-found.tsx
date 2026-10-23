import Link from 'next/link';

// Shown for a missing slug and for an unpublished profile alike: visitors cannot tell the two
// apart, which is deliberate.
export default function ProfileNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Portfolio not found</h1>
      <p className="mt-3 max-w-md text-slate-600 dark:text-slate-400">
        This page doesn&apos;t exist, or its owner hasn&apos;t published it yet.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-slate-300 px-5 py-2 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        Back to home
      </Link>
    </main>
  );
}
