import { ShareButton } from '../ShareButton';
import { buildBlocks, buildHeader, type Block, type HeaderModel } from './blocks';
import { Avatar, DateRange, NewTabLink } from './parts';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';

// Bold and expressive: a full-width header in the accent color with oversized type, then sections
// laid out as a big numbered title beside its content (stacked on small screens).

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';

function Header({ header }: { header: HeaderModel }) {
  const pill =
    'inline-flex items-center rounded-full border-2 border-current px-4 py-2 text-sm font-bold transition hover:bg-on-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent';
  return (
    <header className="bg-accent text-on-accent [--accent-fg:var(--on-accent)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-5 pt-12 pb-14 sm:px-8 sm:pt-16 sm:pb-20 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {header.location && (
            <p className="mb-5 inline-block rounded-full border-2 border-current px-3 py-1 text-xs font-bold tracking-widest uppercase">
              {header.location}
            </p>
          )}
          <h1 className="text-4xl leading-none font-black tracking-tight sm:text-6xl md:text-8xl">
            {header.name}
          </h1>
          {header.tagline && (
            <p className="mt-5 max-w-2xl text-xl font-medium sm:text-2xl">{header.tagline}</p>
          )}
          <ul className="mt-8 flex flex-wrap gap-3">
            {header.links.map((link) => (
              <li key={link.id}>
                {link.external ? (
                  <NewTabLink href={link.href} className={pill}>
                    {link.label}
                  </NewTabLink>
                ) : (
                  <a href={link.href} className={pill}>
                    {link.label}
                  </a>
                )}
              </li>
            ))}
            <li>
              <ShareButton url={header.share.url} title={header.share.title} variant="inverse" />
            </li>
          </ul>
        </div>
        <Avatar
          avatar={header.avatar}
          className="size-36 shrink-0 rotate-3 rounded-3xl border-4 border-current shadow-xl sm:size-52"
          placeholderClassName="bg-on-accent text-5xl font-black text-accent sm:text-7xl"
        />
      </div>
    </header>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'about':
      return (
        <p className="text-xl leading-snug font-medium whitespace-pre-line sm:text-2xl">
          {block.text}
        </p>
      );
    case 'skills':
      return (
        <ul className="flex flex-wrap gap-2">
          {block.skills.map((skill) => (
            <li
              key={skill.id}
              className="rounded-full border-2 border-ink px-4 py-1.5 font-semibold"
            >
              {skill.name}
            </li>
          ))}
        </ul>
      );
    case 'projects':
      return (
        <ul className="grid gap-5 lg:grid-cols-2">
          {block.projects.map((project) => (
            <li
              key={project.id}
              className="relative min-w-0 rounded-2xl border-2 border-ink bg-page p-5 shadow-[5px_5px_0_0_var(--accent)] transition focus-within:-translate-y-0.5 hover:-translate-y-0.5"
            >
              <h3 className="text-xl font-black">
                {project.href ? (
                  <NewTabLink
                    href={project.href}
                    className={`after:absolute after:inset-0 after:rounded-2xl ${focusRing}`}
                  >
                    {project.name}
                  </NewTabLink>
                ) : (
                  project.name
                )}
              </h3>
              {project.description && (
                <p className="mt-2 whitespace-pre-line text-muted">{project.description}</p>
              )}
              {project.tags.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent-fg"
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
      return (
        <ol className="space-y-7">
          {block.entries.map((entry) => (
            <li key={entry.id} className="min-w-0 border-s-4 border-accent ps-5">
              <h3 className="text-xl font-black">{entry.title}</h3>
              {entry.subtitle && <p className="font-medium text-muted">{entry.subtitle}</p>}
              {entry.start && (
                <p className="mt-1 text-xs font-bold tracking-widest text-accent-fg uppercase">
                  <DateRange
                    start={entry.start}
                    end={entry.end}
                    openEnded={block.variant !== 'custom'}
                  />
                </p>
              )}
              {entry.description && <p className="mt-3 whitespace-pre-line">{entry.description}</p>}
              {entry.href && (
                <p className="mt-3">
                  <NewTabLink
                    href={entry.href}
                    context={entry.title}
                    className={`font-bold text-accent-fg underline underline-offset-4 ${focusRing}`}
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
}

export default function CreativeTheme({ profile, idPrefix = '' }: ThemeProps) {
  const blocks = buildBlocks(profile, idPrefix);
  return (
    <ThemeWrapper theme="creative" profile={profile}>
      <Header header={buildHeader(profile)} />
      <main id={`${idPrefix}main`} className="mx-auto max-w-5xl px-5 pb-16 sm:px-8">
        {blocks.map((block, index) => (
          <section
            key={block.id}
            aria-labelledby={block.id}
            className="grid gap-5 border-t-4 border-ink py-10 first:border-t-0 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10"
          >
            <div className="min-w-0 md:sticky md:top-6 md:self-start">
              <span
                aria-hidden="true"
                className="mb-1 block text-sm font-black tracking-widest text-accent-fg"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2
                id={block.id}
                className="text-3xl leading-tight font-black tracking-tight md:text-3xl"
              >
                {block.title}
              </h2>
            </div>
            <div className="min-w-0">
              <BlockView block={block} />
            </div>
          </section>
        ))}
      </main>
    </ThemeWrapper>
  );
}
