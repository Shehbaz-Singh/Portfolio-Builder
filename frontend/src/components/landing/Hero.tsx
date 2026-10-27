import Image from 'next/image';
import Link from 'next/link';
import { buttonStyles } from '../ui';

// A framed screenshot of a made-up example portfolio (public/landing/*.jpg), so the first screen
// shows the result without loading a theme or calling the API.
export function Browser({
  src,
  alt,
  priority = false,
  sizes,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes: string;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-page shadow-overlay">
      <div aria-hidden="true" className="flex gap-1.5 border-b border-line bg-surface px-4 py-3">
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
      </div>
      <Image
        src={src}
        alt={alt}
        width={1280}
        height={800}
        priority={priority}
        sizes={sizes}
        className="h-auto w-full"
      />
    </div>
  );
}

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20"
    >
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h1 id="hero-heading" className="type-hero text-balance">
            A portfolio page you can share with one link
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Upload your resume or fill in your details, pick a theme, and publish.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className={buttonStyles({ variant: 'primary' })}>
              Create your portfolio
            </Link>
            <a href="#themes" className={buttonStyles()}>
              See the themes
            </a>
          </div>
        </div>
        <Browser
          src="/landing/creative.jpg"
          alt="An example portfolio in the Creative theme: a large name on a colored header, then numbered About, Experience and Skills sections."
          priority
          sizes="(min-width: 1024px) 560px, 100vw"
        />
      </div>
    </section>
  );
}
