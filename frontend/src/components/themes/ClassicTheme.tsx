import { ShareButton } from '../ShareButton';
import { buildBlocks, buildHeader, type Block, type HeaderModel } from './blocks';
import { Avatar, DateRange, NewTabLink } from './parts';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';

// A traditional resume: a centered name in serif capitals, a contact line, then sections with
// ruled serif headings. Jobs and degrees put the dates on the right (under the title on a phone).

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const link = `text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`;

function Header({ header }: { header: HeaderModel }) {
  const contact = [
    ...(header.location ? [{ id: 'location', node: <span>{header.location}</span> }] : []),
    ...header.links.map((item) => ({
      id: item.id,
      node: item.external ? (
        <NewTabLink href={item.href} className={link}>
          {item.label}
        </NewTabLink>
      ) : (
        <a href={item.href} className={link}>
          {item.label}
        </a>
      ),
    })),
  ];

  return (
    <header className="border-b-2 border-ink pb-6 text-center">
      {header.avatar.src && (
        <Avatar
          avatar={header.avatar}
          className="mx-auto mb-4 size-24 rounded-full border border-line"
          placeholderClassName=""
        />
      )}
      <h1 className="font-serif text-4xl tracking-wide uppercase sm:text-5xl">{header.name}</h1>
      {header.tagline && (
        <p className="mt-2 font-serif text-lg text-muted italic">{header.tagline}</p>
      )}
      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm">
        {contact.map((item) => (
          <li key={item.id}>{item.node}</li>
        ))}
        <li>
          <ShareButton url={header.share.url} title={header.share.title} variant="outline" />
        </li>
      </ul>
    </header>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'about':
      return <p className="leading-relaxed whitespace-pre-line">{block.text}</p>;
    case 'skills':
      return (
        <ul className="flex flex-wrap gap-x-2 gap-y-1">
          {block.skills.map((skill) => (
            <li
              key={skill.id}
              className="after:ms-2 after:text-muted after:content-['·'] last:after:content-none"
            >
              {skill.name}
            </li>
          ))}
        </ul>
      );
    case 'projects':
      return (
        <ul className="space-y-4">
          {block.projects.map((project) => (
            <li key={project.id} className="min-w-0">
              <h3 className="font-serif text-lg font-bold">
                {project.href ? (
                  <NewTabLink href={project.href} className={link}>
                    {project.name}
                  </NewTabLink>
                ) : (
                  project.name
                )}
              </h3>
              {project.description && <p className="whitespace-pre-line">{project.description}</p>}
              {project.tags.length > 0 && (
                <p className="mt-1 text-sm text-muted italic">{project.tags.join(', ')}</p>
              )}
            </li>
          ))}
        </ul>
      );
    case 'entries':
      return (
        <ol className="space-y-5">
          {block.entries.map((entry) => (
            <li key={entry.id} className="min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <h3 className="font-serif text-lg font-bold">
                  {entry.title}
                  {entry.subtitle && (
                    <span className="font-normal text-muted italic">, {entry.subtitle}</span>
                  )}
                </h3>
                {entry.start && (
                  <p className="text-sm text-muted sm:shrink-0 sm:whitespace-nowrap">
                    <DateRange
                      start={entry.start}
                      end={entry.end}
                      openEnded={block.variant !== 'custom'}
                    />
                  </p>
                )}
              </div>
              {entry.description && <p className="mt-1 whitespace-pre-line">{entry.description}</p>}
              {entry.href && (
                <p className="mt-1 text-sm">
                  <NewTabLink href={entry.href} context={entry.title} className={link}>
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

export default function ClassicTheme({ profile, idPrefix }: ThemeProps) {
  return (
    <ThemeWrapper profile={profile} className="theme-classic">
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Header header={buildHeader(profile)} />
        {buildBlocks(profile, idPrefix).map((block) => (
          <section key={block.id} aria-labelledby={block.id} className="mt-8">
            <h2
              id={block.id}
              className="border-b border-ink pb-1 font-serif text-base font-bold tracking-widest uppercase"
            >
              {block.title}
            </h2>
            <div className="mt-4">
              <BlockView block={block} />
            </div>
          </section>
        ))}
      </main>
    </ThemeWrapper>
  );
}
