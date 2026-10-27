import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:px-8">
        <p>Portfolio Generator. Made by a developer, for all developers.</p>
        <nav aria-label="Footer">
          <ul className="flex gap-5">
            <li>
              <Link href="/privacy" className="hover:text-ink hover:underline">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-ink hover:underline">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-ink hover:underline">
                Log in
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
