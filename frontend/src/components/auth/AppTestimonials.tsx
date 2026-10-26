'use client';

import { useState } from 'react';
import { APP_TESTIMONIALS } from '@/lib/app-testimonials';

// An endless strip of what people say about the app: the cards keep flowing past (see .marquee-*
// in globals.css). It stops only when the reader asks with the Pause button, while keyboard focus
// is inside it (not after a mouse click), or when the system asks for reduced motion (then it is a row to scroll by hand).
// The list is drawn twice for the seamless loop; the second copy is hidden from everyone else.
export function AppTestimonials() {
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);

  if (APP_TESTIMONIALS.length === 0) return null;

  const copy = (hidden: boolean) => (
    <ul
      className={`flex shrink-0 ${hidden ? 'marquee-copy' : ''}`}
      aria-hidden={hidden || undefined}
      inert={hidden}
    >
      {APP_TESTIMONIALS.map((item, i) => (
        <li key={i} className="w-72 shrink-0 p-2 sm:w-80">
          <figure className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6">
            <blockquote className="flex-1 leading-relaxed">
              <span aria-hidden="true" className="text-accent-fg">
                “
              </span>
              {item.quote}
              <span aria-hidden="true" className="text-accent-fg">
                ”
              </span>
            </blockquote>
            <figcaption className="mt-4 text-sm">
              <span className="font-semibold">{item.name}</span>
              <span className="block text-muted">{item.role}</span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );

  return (
    // The wrapper only watches keyboard focus to hold the strip still; it is not a control.
    <div
      role="presentation"
      onFocus={(e) => setFocused(e.target.matches(':focus-visible'))}
      onBlur={() => setFocused(false)}
      className={`min-w-0 ${paused || focused ? 'marquee-paused' : ''}`}
    >
      <section aria-label="What people say about Portfolio Generator">
        <div className="mb-4 flex items-center gap-4">
          <h2 className="text-sm font-semibold tracking-wider text-muted uppercase">
            What people say
          </h2>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            className="min-h-6 rounded px-1 text-sm text-muted underline underline-offset-2 hover:text-ink"
          >
            {paused ? 'Play' : 'Pause'}
            <span className="sr-only"> the scrolling quotes</span>
          </button>
        </div>
        <div className="marquee-view overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="marquee-track">
            {copy(false)}
            {copy(true)}
          </div>
        </div>
      </section>
    </div>
  );
}
