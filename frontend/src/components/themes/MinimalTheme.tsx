import type { ReactNode } from 'react';
import { ShareButton } from '../ShareButton';
import { buildBlocks, buildHeader, type Block, type HeaderModel } from './blocks';
import { Avatar, DateRange, NewTabLink } from './parts';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';

// A clean single column. Also the layout of the Dark theme, which only changes the palette.

const chip = 'rounded-full bg-surface px-3 py-1 text-sm text-ink';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="mb-5 text-sm font-semibold tracking-wider text-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Header({ header }: { header: HeaderModel }) {
  return (
    <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:gap-8 sm:text-left">
      <Avatar
        avatar={header.avatar}
        className="size-28 shrink-0 rounded-full shadow-md ring-4 ring-page sm:size-32"
        placeholderClassName="bg-accent text-3xl font-semibold text-on-accent"
      />
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{header.name}</h1>
        {header.tagline && <p className="mt-2 text-lg text-ink">{header.tagline}</p>}
        {header.location && (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted sm:justify-start">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M9.69 18.93a.75.75 0 0 0 .62 0C13.9 17.2 17 13.4 17 9A7 7 0 1 0 3 9c0 4.4 3.1 8.2 6.69 9.93ZM10 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
                clipRule="evenodd"
              />
            </svg>
            <span>{header.location}</span>
          </p>
        )}
        <ul className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
          {header.links.map((link) => (
            <li key={link.id}>
              {link.external ? (
                <NewTabLink
                  href={link.href}
                  className={`inline-flex items-center rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:bg-surface ${focusRing}`}
                >
                  {link.label}
                </NewTabLink>
              ) : (
                <a
                  href={link.href}
                  className={`inline-flex items-center rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:bg-surface ${focusRing}`}
                >
                  {link.label}
                </a>
              )}
            </li>
          ))}
          <li>
            <ShareButton url={header.share.url} title={header.share.title} />
          </li>
        </ul>
      </div>
    </header>
  );
}

// Jobs, degrees and the items of custom sections share one timeline-or-list look.
function EntryList({ block }: { block: Extract<Block, { kind: 'entries' }> }) {
  const timeline = block.variant !== 'custom';
  return (
    <ol className={timeline ? 'border-s border-line' : 'space-y-6'}>
      {block.entries.map((entry) => (
        <li key={entry.id} className={timeline ? 'relative pb-8 ps-6 last:pb-0' : undefined}>
          {timeline && (
            <span
              aria-hidden="true"
              className="absolute start-0 top-2 size-3 -translate-x-1/2 rounded-full border-2 border-page bg-accent"
            />
          )}
          <h3 className="font-semibold">{entry.title}</h3>
          {entry.subtitle && <p className="text-muted">{entry.subtitle}</p>}
          {entry.start && (
            <p className="mt-0.5 text-sm text-muted">
              <DateRange
                start={entry.start}
                end={entry.end}
                openEnded={block.variant !== 'custom'}
              />
            </p>
          )}
          {entry.description && (
            <p className="mt-2 whitespace-pre-line text-ink">{entry.description}</p>
          )}
          {entry.href && (
            <p className="mt-2">
              <NewTabLink
                href={entry.href}
                context={entry.title}
                className={`text-sm font-medium text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
              >
                View
              </NewTabLink>
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'about':
      return <p className="leading-relaxed whitespace-pre-line text-ink">{block.text}</p>;
    case 'skills':
      return (
        <ul className="flex flex-wrap gap-2">
          {block.skills.map((skill) => (
            <li key={skill.id} className={`${chip}`}>
              {skill.name}
            </li>
          ))}
        </ul>
      );
    case 'projects':
      return (
        <ul className="grid gap-4 sm:grid-cols-2">
          {block.projects.map((project) => (
            <li
              key={project.id}
              className="relative flex min-w-0 flex-col rounded-xl border border-line p-5 transition focus-within:border-accent hover:border-accent/50 hover:shadow-sm"
            >
              <h3 className="font-semibold">
                {project.href ? (
                  <NewTabLink
                    href={project.href}
                    className={`after:absolute after:inset-0 after:rounded-xl ${focusRing}`}
                  >
                    {project.name}
                  </NewTabLink>
                ) : (
                  project.name
                )}
              </h3>
              {project.description && (
                <p className="mt-2 text-sm whitespace-pre-line text-muted">{project.description}</p>
              )}
              {project.tags.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-fg"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      );
    case 'entries':
      return <EntryList block={block} />;
  }
}

// The layout, with the palette class a theme wants: none for Minimal, "theme-dark" for Dark.
export function MinimalLayout({
  profile,
  idPrefix = '',
  theme = 'minimal',
}: ThemeProps & { theme?: 'minimal' | 'dark' }) {
  return (
    <ThemeWrapper theme={theme} profile={profile}>
      <main id={`${idPrefix}main`} className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Header header={buildHeader(profile)} />
        {buildBlocks(profile, idPrefix).map((block) => (
          <Section key={block.id} id={block.id} title={block.title}>
            <BlockView block={block} />
          </Section>
        ))}
      </main>
    </ThemeWrapper>
  );
}

export default function MinimalTheme(props: ThemeProps) {
  return <MinimalLayout {...props} />;
}
