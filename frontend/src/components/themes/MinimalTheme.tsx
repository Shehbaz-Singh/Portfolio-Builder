import type { ReactNode } from 'react';
import { ArrowUpRight, Heart, MapPin, Quote } from 'lucide-react';
import { ShareButton } from '../ShareButton';
import {
  buildBlocks,
  buildFooter,
  buildHeader,
  type Block,
  type FooterModel,
  type HeaderModel,
} from './blocks';
import { LeaveTestimonial } from './LeaveTestimonial';
import { Avatar, DateRange, EmptyPage, HeaderLink, InitialsBadge, NewTabLink } from './parts';
import { Reveal } from './Reveal';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';

// A clean, airy single column: generous space, quiet type, a thin accent mark on each heading.
// Also the layout of the Dark theme, which changes the palette (.theme-dark) and adds a soft glow
// behind the header and tinted cards, so it is soft contrast rather than a plain inversion.

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';

function Section({
  id,
  title,
  animate,
  children,
}: {
  id: string;
  title: string;
  animate: boolean;
  children: ReactNode;
}) {
  return (
    <Reveal enabled={animate}>
      <section aria-labelledby={id} className="mt-16 sm:mt-20">
        <h2
          id={id}
          className="mb-6 flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-muted uppercase"
        >
          <span aria-hidden="true" className="h-px w-8 shrink-0 bg-accent" />
          {title}
        </h2>
        {children}
      </section>
    </Reveal>
  );
}

function Header({ header }: { header: HeaderModel }) {
  const pill = `inline-flex max-w-full items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:bg-surface motion-safe:hover:-translate-y-0.5 ${focusRing}`;
  return (
    <header className="rise-in relative flex flex-col items-center gap-6 text-center sm:flex-row sm:gap-10 sm:text-left">
      <Avatar
        avatar={header.avatar}
        className="size-32 shrink-0 rounded-full shadow-raised ring-4 ring-page sm:size-40"
        placeholderClassName="bg-accent-soft text-4xl font-semibold text-accent-fg sm:text-5xl"
      />
      <div className="min-w-0">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {header.name}
        </h1>
        {header.tagline && (
          <p className="mt-3 text-lg text-pretty text-muted sm:text-xl">{header.tagline}</p>
        )}
        {header.location && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted sm:justify-start">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            <span>{header.location}</span>
          </p>
        )}
        <ul className="mt-6 flex flex-wrap justify-center gap-2 sm:justify-start">
          {header.links.map((link) => (
            <li key={link.id} className="max-w-full">
              <HeaderLink link={link} className={pill} />
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
    <ol className={timeline ? 'border-s border-line' : 'space-y-8'}>
      {block.entries.map((entry) => (
        <li key={entry.id} className={timeline ? 'relative pb-10 ps-8 last:pb-0' : undefined}>
          {timeline && (
            <span
              aria-hidden="true"
              className="absolute start-0 top-1.5 size-3.5 -translate-x-1/2 rounded-full border-2 border-accent bg-page"
            />
          )}
          {entry.start && (
            <p className="mb-1 text-xs font-medium tracking-wide text-muted uppercase tabular-nums">
              <DateRange
                start={entry.start}
                end={entry.end}
                openEnded={block.variant !== 'custom'}
              />
            </p>
          )}
          <h3 className="text-lg font-semibold">{entry.title}</h3>
          {entry.subtitle && <p className="text-muted">{entry.subtitle}</p>}
          {entry.description && (
            <p className="mt-3 leading-relaxed whitespace-pre-line text-ink">{entry.description}</p>
          )}
          {entry.href && (
            <p className="mt-3">
              <NewTabLink
                href={entry.href}
                context={entry.title}
                className={`inline-flex items-center gap-1 text-sm font-medium text-accent-fg underline underline-offset-4 hover:no-underline ${focusRing}`}
              >
                View
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </NewTabLink>
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function BlockView({ block, dark }: { block: Block; dark: boolean }) {
  // Cards are plain on the light page and softly tinted on the dark one.
  const card = dark ? 'border-line bg-surface/50' : 'border-line bg-page';
  switch (block.kind) {
    case 'about':
      return (
        <p className="max-w-prose text-lg leading-8 whitespace-pre-line text-ink">{block.text}</p>
      );
    case 'skills':
      return (
        <ul className="flex flex-wrap gap-2">
          {block.skills.map((skill) => (
            <li
              key={skill.id}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${dark ? 'border-line bg-surface/60' : 'border-transparent bg-surface'}`}
            >
              {skill.name}
            </li>
          ))}
        </ul>
      );
    case 'projects':
      return (
        <ul className="grid gap-5 sm:grid-cols-2">
          {block.projects.map((project) => (
            <li
              key={project.id}
              className={`group relative flex min-w-0 flex-col rounded-card border p-6 transition duration-300 ${card} ${
                project.href
                  ? 'hover:border-accent/60 hover:shadow-raised focus-within:border-accent motion-safe:hover:-translate-y-1'
                  : ''
              }`}
            >
              <h3 className="flex items-start justify-between gap-3 text-lg font-semibold">
                {project.href ? (
                  <>
                    <NewTabLink
                      href={project.href}
                      className={`min-w-0 after:absolute after:inset-0 after:rounded-card ${focusRing}`}
                    >
                      {project.name}
                    </NewTabLink>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="mt-1 size-5 shrink-0 text-muted transition group-hover:text-accent-fg motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                    />
                  </>
                ) : (
                  project.name
                )}
              </h3>
              {project.description && (
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted">
                  {project.description}
                </p>
              )}
              {project.tags.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-1.5">
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
    case 'testimonials':
      return (
        <>
          {block.testimonials.length > 0 ? (
            <ul className="grid gap-5 sm:grid-cols-2">
              {block.testimonials.map((item) => (
                <li key={item.id} className="min-w-0">
                  <figure
                    className={`flex h-full flex-col rounded-card border p-6 ${dark ? 'border-line bg-surface/50' : 'border-line bg-surface/40'}`}
                  >
                    <Quote aria-hidden="true" className="size-7 text-accent-fg opacity-80" />
                    <blockquote className="mt-4 flex-1 leading-relaxed whitespace-pre-line text-ink">
                      {item.message}
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 text-sm">
                      <InitialsBadge
                        name={item.name}
                        className="size-10 bg-accent-soft text-sm text-accent-fg"
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold">{item.name}</span>
                        {item.detail && <span className="block text-muted">{item.detail}</span>}
                      </span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No testimonials yet.</p>
          )}
          {block.submitTo && (
            <LeaveTestimonial
              slug={block.submitTo}
              buttonClassName={`inline-flex items-center rounded-full border border-line px-5 py-2 text-sm font-medium transition hover:bg-surface motion-safe:hover:-translate-y-0.5 ${focusRing}`}
            />
          )}
        </>
      );
    case 'entries':
      return <EntryList block={block} />;
  }
}

function Footer({ footer }: { footer: FooterModel }) {
  return (
    <footer className="mx-auto max-w-3xl px-5 pb-12 sm:px-8">
      <div className="mt-20 flex flex-col items-center gap-2 border-t border-line pt-8 text-center text-sm text-muted">
        <p>
          © {footer.year} {footer.name}
        </p>
        <p>
          Made with <span className="sr-only">love</span>
          <Heart
            aria-hidden="true"
            fill="currentColor"
            className="inline size-4 align-text-bottom text-accent-fg"
          />{' '}
          {footer.message}
        </p>
        <a
          href={footer.cta.href}
          className={`font-medium text-accent-fg underline underline-offset-4 hover:no-underline ${focusRing}`}
        >
          {footer.cta.label}
        </a>
      </div>
    </footer>
  );
}

// The layout, with the palette class a theme wants: none for Minimal, "theme-dark" for Dark.
export function MinimalLayout({
  profile,
  idPrefix = '',
  theme = 'minimal',
}: ThemeProps & { theme?: 'minimal' | 'dark' }) {
  const dark = theme === 'dark';
  const blocks = buildBlocks(profile, idPrefix);
  return (
    <ThemeWrapper theme={theme} profile={profile}>
      <main
        id={`${idPrefix}main`}
        className="relative mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-20"
      >
        {dark && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 h-96 w-screen -translate-x-1/2 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent)]"
          />
        )}
        <Header header={buildHeader(profile)} />
        {blocks.map((block) => (
          <Section key={block.id} id={block.id} title={block.title} animate={!idPrefix}>
            <BlockView block={block} dark={dark} />
          </Section>
        ))}
        {blocks.length === 0 && <EmptyPage className="mt-16 text-center text-muted" />}
      </main>
      <Footer footer={buildFooter(profile)} />
    </ThemeWrapper>
  );
}

export default function MinimalTheme(props: ThemeProps) {
  return <MinimalLayout {...props} />;
}
