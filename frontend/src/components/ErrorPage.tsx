import type { ReactNode } from 'react';

// The full-screen message behind the 404 page and the error pages, so they all look alike.
// `eyebrow` is the small label above the title ("404"), `children` the buttons.
export function ErrorPage({
  eyebrow,
  title,
  message,
  children,
  main = true,
}: {
  eyebrow?: string;
  title: string;
  message: string;
  children: ReactNode;
  main?: boolean; // false inside the dashboard, which already has a main region
}) {
  const Tag = main ? 'main' : 'div';
  return (
    <Tag
      id={main ? 'main' : undefined}
      className={`flex flex-col items-center justify-center px-6 text-center ${main ? 'min-h-screen' : 'min-h-[60vh]'}`}
    >
      {eyebrow && (
        <p className="text-sm font-semibold tracking-wider text-accent-fg uppercase">{eyebrow}</p>
      )}
      <h1 className="type-page mt-3">{title}</h1>
      <p className="mt-3 max-w-md text-muted">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>
    </Tag>
  );
}
