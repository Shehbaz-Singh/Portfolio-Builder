import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tight">Portfolio Generator</h1>
      <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
        Fill in your details, pick a look, and get a portfolio page at your own link.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/register"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create your portfolio
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
