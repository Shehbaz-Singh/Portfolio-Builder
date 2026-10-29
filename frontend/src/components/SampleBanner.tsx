import Link from 'next/link';
import { uiFor, type Ui } from '@/lib/i18n';

// Shown at the top of a sample profile's pages (the made-up examples): so nobody takes the person
// for real. Plain colors of the app, not the theme's, so it reads the same over every theme.
export function SampleBanner({ ui = uiFor('en').sample }: { ui?: Ui['sample'] }) {
  return (
    <div
      role="note"
      className="brand border-b border-[#d8cdbd] bg-[#f4ede2] px-4 py-2 text-center text-sm text-[#1f1a17]"
    >
      <strong className="font-semibold">{ui.label}</strong> {ui.text}{' '}
      <Link href="/register" className="font-medium text-[#9e3d21] underline underline-offset-2">
        {ui.cta}
      </Link>
    </div>
  );
}
