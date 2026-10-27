import type { ReactNode } from 'react';
import { Bricolage_Grotesque, Space_Mono } from 'next/font/google';
import { ArrowUpRight, MapPin } from 'lucide-react';
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
import { Avatar, DateRange, EmptyPage, HeaderLink, NewTabLink } from './parts';
import { Reveal } from './Reveal';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';

// Bold and expressive. The one big idea: every section hangs off a huge outlined number that stays
// in view while its content scrolls past (stacked above the title on a phone), under a header in
// the accent color whose bottom edge is cut on a slant. Oversized type, hard borders, offset
// shadows that shift on hover. Bricolage Grotesque for everything, Space Mono for dates and tags.

// preload is off: every theme's fonts are known to the page bundle, and preloading would fetch all
// of them. Only the faces a page draws are downloaded, when it draws them.
const display = Bricolage_Grotesque({ subsets: ['latin'], display: 'swap', preload: false });
const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-theme-mono',
  display: 'swap',
  preload: false,
});
const monoText = 'font-(family-name:--font-theme-mono)';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';

function Header({ header }: { header: HeaderModel }) {
  const pill = `inline-flex max-w-full items-center gap-2 rounded-full border-2 border-current px-4 py-2 text-sm font-bold transition hover:bg-on-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent motion-safe:hover:-translate-y-0.5`;
  return (
    <header className="rise-in relative bg-accent text-on-accent [--accent-fg:var(--on-accent)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-5 pt-12 pb-24 sm:px-8 sm:pt-16 sm:pb-28 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {header.location && (
            <p className="mb-5 inline-flex max-w-full items-center gap-1.5 rounded-full border-2 border-current px-3 py-1 text-xs font-bold tracking-widest uppercase">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              {header.location}
            </p>
          )}
          <h1 className="text-[clamp(2.5rem,10vw,6.5rem)] leading-[0.92] font-black tracking-tighter text-balance">
            {header.name}
          </h1>
          {header.tagline && (
            <p className="mt-5 max-w-2xl text-xl font-medium text-pretty sm:text-2xl">
              {header.tagline}
            </p>
          )}
          <ul className="mt-8 flex flex-wrap gap-3">
            {header.links.map((link) => (
              <li key={link.id} className="max-w-full">
                <HeaderLink link={link} className={pill} />
              </li>
            ))}
            <li>
              <ShareButton url={header.share.url} title={header.share.title} variant="inverse" />
            </li>
          </ul>
        </div>
        <Avatar
          avatar={header.avatar}
          className="size-36 shrink-0 rotate-3 rounded-[2rem] border-4 border-current shadow-[8px_8px_0_0_rgb(0_0_0/0.22)] transition-transform duration-300 motion-safe:hover:rotate-0 sm:size-52"
          placeholderClassName="bg-on-accent text-5xl font-black text-accent sm:text-7xl"
        />
      </div>
      {/* The slanted edge: a page-colored wedge laid over the bottom, so nothing is clipped (the
          share menu opens over it). */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-px h-11 bg-page [clip-path:polygon(0_100%,100%_100%,100%_0)] sm:h-[4.25rem]"
      />
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
        <ul className="flex flex-wrap gap-2.5">
          {block.skills.map((skill) => (
            <li
              key={skill.id}
              className="rounded-full border-2 border-ink px-4 py-1.5 font-bold transition hover:bg-accent hover:text-on-accent motion-safe:hover:-translate-y-0.5"
            >
              {skill.name}
            </li>
          ))}
        </ul>
      );
    case 'projects':
      return (
        <ul className="grid gap-6 lg:grid-cols-2">
          {block.projects.map((project) => (
            <li
              key={project.id}
              className={`group relative flex min-w-0 flex-col rounded-2xl border-2 border-ink bg-page p-6 shadow-[6px_6px_0_0_var(--accent)] transition-all duration-200 ${
                project.href
                  ? 'focus-within:-translate-x-0.5 focus-within:-translate-y-0.5 focus-within:shadow-[9px_9px_0_0_var(--accent)] motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_var(--accent)]'
                  : ''
              }`}
            >
              <h3 className="text-2xl leading-tight font-black">
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
                <p className="mt-3 whitespace-pre-line text-muted">{project.description}</p>
              )}
              {project.tags.length > 0 && (
                <ul className={`${monoText} mt-4 flex flex-wrap gap-1.5`}>
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
              {project.href && (
                <span
                  aria-hidden="true"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-black tracking-wide uppercase"
                >
                  View project
                  <ArrowUpRight className="size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              )}
            </li>
          ))}
        </ul>
      );
    case 'testimonials':
      return (
        <>
          {block.testimonials.length > 0 ? (
            <ul className="grid gap-6 lg:grid-cols-2">
              {block.testimonials.map((item) => (
                <li key={item.id} className="min-w-0">
                  <figure className="flex h-full flex-col rounded-2xl border-2 border-ink bg-accent-soft p-6 shadow-[6px_6px_0_0_var(--text)] transition-transform duration-300 motion-safe:odd:-rotate-1 motion-safe:even:rotate-1 motion-safe:hover:rotate-0">
                    <span
                      aria-hidden="true"
                      className="block h-10 text-7xl leading-[0.8] font-black text-accent-fg"
                    >
                      “
                    </span>
                    <blockquote className="mt-2 flex-1 text-lg leading-snug font-medium whitespace-pre-line">
                      {item.message}
                    </blockquote>
                    <figcaption className="mt-5">
                      <span className="block font-black">{item.name}</span>
                      {item.detail && <span className="font-medium text-muted">{item.detail}</span>}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-lg font-medium text-muted">No testimonials yet.</p>
          )}
          {block.submitTo && (
            <LeaveTestimonial
              slug={block.submitTo}
              buttonClassName={`inline-flex items-center rounded-full border-2 border-ink px-5 py-2 font-bold transition hover:bg-ink hover:text-page motion-safe:hover:-translate-y-0.5 ${focusRing}`}
            />
          )}
        </>
      );
    case 'entries':
      return (
        <ol className="space-y-8">
          {block.entries.map((entry) => (
            <li key={entry.id} className="min-w-0 border-s-4 border-accent ps-5">
              {entry.start && (
                <p
                  className={`${monoText} mb-2 inline-block bg-ink px-2 py-0.5 text-xs font-bold tracking-widest text-page uppercase tabular-nums`}
                >
                  <DateRange
                    start={entry.start}
                    end={entry.end}
                    openEnded={block.variant !== 'custom'}
                  />
                </p>
              )}
              <h3 className="text-2xl leading-tight font-black">{entry.title}</h3>
              {entry.subtitle && <p className="mt-1 font-medium text-muted">{entry.subtitle}</p>}
              {entry.description && <p className="mt-3 whitespace-pre-line">{entry.description}</p>}
              {entry.href && (
                <p className="mt-3">
                  <NewTabLink
                    href={entry.href}
                    context={entry.title}
                    className={`inline-flex items-center gap-1 font-bold text-accent-fg underline underline-offset-4 ${focusRing}`}
                  >
                    View
                    <ArrowUpRight aria-hidden="true" className="size-5" />
                  </NewTabLink>
                </p>
              )}
            </li>
          ))}
        </ol>
      );
  }
}

function Footer({ footer }: { footer: FooterModel }) {
  return (
    <footer className="bg-ink text-page">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-12 sm:px-8 md:flex-row md:items-end md:justify-between">
        <p className="max-w-md text-2xl leading-tight font-black text-balance sm:text-3xl">
          Made {footer.message}
        </p>
        <div className="text-sm font-medium">
          <p className="opacity-80">
            © {footer.year} {footer.name}
          </p>
          <a
            href={footer.cta.href}
            className="mt-1 inline-block font-bold underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-page"
          >
            {footer.cta.label} →
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function CreativeTheme({ profile, idPrefix = '' }: ThemeProps) {
  const blocks = buildBlocks(profile, idPrefix);
  const animate = !idPrefix;
  return (
    <ThemeWrapper
      theme="creative"
      profile={profile}
      className={`${display.className} ${mono.variable}`}
    >
      <Header header={buildHeader(profile)} />
      <main id={`${idPrefix}main`} className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        {blocks.map((block, index) => (
          <Reveal key={block.id} enabled={animate}>
            <ThemeSection block={block} index={index} />
          </Reveal>
        ))}
        {blocks.length === 0 && (
          <EmptyPage className="py-16 text-2xl font-black text-balance sm:text-3xl" />
        )}
      </main>
      <Footer footer={buildFooter(profile)} />
    </ThemeWrapper>
  );
}

function ThemeSection({ block, index }: { block: Block; index: number }): ReactNode {
  return (
    <section
      aria-labelledby={block.id}
      className="grid gap-6 border-t-4 border-ink py-12 first:border-t-0 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10"
    >
      <div className="min-w-0 md:sticky md:top-8 md:self-start">
        <span
          aria-hidden="true"
          className="block text-7xl leading-none font-black text-transparent [-webkit-text-stroke:2px_var(--text)] sm:text-8xl"
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <h2
          id={block.id}
          className="mt-2 text-3xl leading-tight font-black tracking-tight text-balance"
        >
          {block.title}
        </h2>
      </div>
      <div className="min-w-0">
        <BlockView block={block} />
      </div>
    </section>
  );
}
