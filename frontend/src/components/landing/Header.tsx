import Link from 'next/link';
import { buttonStyles } from '../ui';

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#themes', label: 'Themes' },
  { href: '#features', label: 'Features' },
  { href: '#faq', label: 'FAQ' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3 sm:px-8">
        <Link href="/" className="text-sm font-semibold whitespace-nowrap sm:text-base">
          Portfolio Generator
        </Link>
        <nav aria-label="Sections of this page" className="ms-4 hidden md:block">
          <ul className="flex gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-control px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-ink active:bg-line"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <Link
            href="/login"
            className={`${buttonStyles({ variant: 'ghost' })} max-[420px]:hidden`}
          >
            Log in
          </Link>
          <Link
            href="/register"
            className={`${buttonStyles({ variant: 'primary' })} whitespace-nowrap`}
          >
            <span className="sm:hidden">Get started</span>
            <span className="max-sm:hidden">Create your portfolio</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
