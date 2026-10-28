import type { ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';

// Markdown for posts, drawn the same way on the public page and in the editor's preview.
//
// The stored text is never trusted. react-markdown turns Markdown into React elements and never into
// an HTML string, so nothing is injected; raw HTML in the text is dropped (`skipHtml`), only the
// elements listed here are drawn (so no images, which would let a post load something from anywhere),
// and links are limited to http(s), mailto and relative addresses by the library's own URL check, so
// a "javascript:" link is emptied. Every link to another site opens in a new tab with no opener.
const ALLOWED = [
  'p',
  'br',
  'strong',
  'em',
  'del',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'hr',
];

const isExternal = (href: string | undefined) => !!href && /^https?:\/\//i.test(href);

// The page title is the h1, so headings inside a post start one level down.
const heading = (Tag: 'h2' | 'h3' | 'h4', className: string) =>
  function Heading({ children }: { children?: ReactNode }) {
    return <Tag className={className}>{children}</Tag>;
  };

const components: Components = {
  h1: heading('h2', 'wr-display mt-10 mb-3 text-2xl leading-snug font-semibold text-balance'),
  h2: heading('h3', 'wr-display mt-8 mb-3 text-xl leading-snug font-semibold text-balance'),
  h3: heading('h4', 'wr-display mt-6 mb-2 text-lg leading-snug font-semibold'),
  h4: heading('h4', 'wr-display mt-6 mb-2 font-semibold'),
  p: ({ children }) => <p className="my-4 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="my-4 list-disc space-y-1.5 ps-6">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 list-decimal space-y-1.5 ps-6">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-5 border-s-4 border-line ps-4 text-muted italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-line" />,
  pre: ({ children }) => (
    <pre className="my-5 overflow-x-auto rounded-control bg-surface p-4 text-sm leading-relaxed [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded-sm bg-surface px-1 py-0.5 font-mono text-[0.9em]">{children}</code>
  ),
  a: ({ href, children }) =>
    !href ? (
      // A link the URL check emptied (say, "javascript:"): the text stays, the link goes.
      <>{children}</>
    ) : isExternal(href) ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className="text-accent-fg underline underline-offset-2 hover:no-underline"
      >
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    ) : (
      <a href={href} className="text-accent-fg underline underline-offset-2 hover:no-underline">
        {children}
      </a>
    ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="min-w-0 [overflow-wrap:anywhere] [&>:first-child]:mt-0 [&>:last-child]:mb-0">
      <ReactMarkdown skipHtml allowedElements={ALLOWED} unwrapDisallowed components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
