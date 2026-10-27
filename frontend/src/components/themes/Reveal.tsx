'use client';

import { useEffect, useRef, type ReactNode } from 'react';

// Fades a block in the first time it scrolls into view. Only a block that starts below the fold is
// held back, and only for people who have not asked for less motion: everything else (no
// JavaScript, reduced motion, the part of the page already on screen, the editor's preview and
// the theme picker, where `enabled` is false) is drawn normally. The animation itself is in
// globals.css, keyed on data-reveal.
export function Reveal({
  children,
  enabled = true,
  className,
}: {
  children: ReactNode;
  enabled?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.dataset.reveal = 'hidden';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = 'shown';
        observer.disconnect();
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      delete el.dataset.reveal;
    };
  }, [enabled]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
