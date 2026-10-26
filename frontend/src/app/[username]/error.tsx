'use client';

// Shown when the profile cannot be loaded for any reason other than "not found", for example
// the API being down. Distinct from the 404 page so an outage never looks like a missing profile.
export default function ProfileError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main
      id="main"
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-3 max-w-md text-muted">
        We couldn&apos;t load this portfolio right now. Please try again in a moment.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-full border border-line px-5 py-2 text-sm font-medium transition hover:bg-surface"
      >
        Try again
      </button>
    </main>
  );
}
