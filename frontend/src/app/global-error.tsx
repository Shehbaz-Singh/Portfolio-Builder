'use client';

import './globals.css';

// The last resort: an error in the root layout itself, where nothing else (fonts, the shared
// components) can be counted on. It replaces the whole page, so it brings its own html and body.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body className="theme-root min-h-screen antialiased">
        <main
          id="main"
          className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
        >
          <h1 className="type-page">Something went wrong</h1>
          <p className="mt-3 max-w-md text-muted">
            The page could not be shown. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent/90"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
