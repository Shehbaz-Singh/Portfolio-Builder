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
      {/* Everything this site keeps in your browser, so there is nothing to hide: one sign-in cookie
          (set only on login) and two "already seen it" notes. No tracking. Keep in sync with the
          Privacy Policy, section "Cookies, storage and analytics". */}
      <p className="mx-auto max-w-6xl px-5 pb-8 text-xs text-muted sm:px-8">
        In your browser we store one cookie to keep you signed in, and two small notes that remember
        you have seen the welcome tour and the first-publish message. No tracking or advertising.{' '}
        <Link href="/privacy#storage" className="underline hover:text-ink">
          Details
        </Link>
      </p>
    </footer>
  );
}
