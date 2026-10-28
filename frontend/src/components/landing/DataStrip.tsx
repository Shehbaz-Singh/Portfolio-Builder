import Link from 'next/link';

// A plain promise, and only promises the product keeps (see the Privacy Policy).
export function DataStrip() {
  return (
    <section aria-labelledby="data-heading" className="px-5 py-20 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 rounded-card bg-ink p-8 text-page sm:p-12 lg:grid-cols-[1fr_1.3fr] lg:items-center">
        <div>
          <h2 id="data-heading" className="type-page text-3xl sm:text-4xl">
            Your data, your control
          </h2>
          <p className="mt-4 text-page/80">
            Your page is yours. We keep what you give us to run it, and nothing more.
          </p>
          <Link
            href="/privacy"
            className="mt-6 inline-block rounded-control font-medium underline underline-offset-4 hover:no-underline focus-visible:outline-page"
          >
            Read the Privacy Policy
          </Link>
        </div>
        <ul className="space-y-4">
          {[
            ['Hide any section.', 'It stays saved, so you can bring it back later.'],
            ['Export your data.', 'Download everything you added as a file, whenever you like.'],
            ['Delete your account.', 'It removes your profile, posts, testimonials and images.'],
          ].map(([title, text]) => (
            <li key={title} className="border-s-2 border-page/30 ps-4">
              <span className="font-semibold">{title}</span>{' '}
              <span className="text-page/80">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
