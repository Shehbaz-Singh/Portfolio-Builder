import type { ReactNode } from 'react';
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

// A refined resume: a sheet of paper on a slightly darker desk, a centered name in spaced serif
// capitals under a double rule, ruled small-caps headings, dates set to the right, and quotes set
// as serif pull quotes. Restrained: no cards, no boxes, the links are quiet text with an icon.

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
const link = `text-accent-fg underline underline-offset-4 decoration-1 hover:decoration-2 ${focusRing}`;

function Header({ header }: { header: HeaderModel }) {
  const contact = `inline-flex items-center gap-1.5 py-0.5 ${link}`;
  return (
    <header className="rise-in border-b-4 border-double border-ink pb-8 text-center">
      {/* A monogram stands in for a missing photo, so the header looks the same either way. */}
      <Avatar
        avatar={header.avatar}
        className="mx-auto mb-5 size-28 rounded-full border border-ink p-1 ring-1 ring-line ring-offset-4 ring-offset-page"
        placeholderClassName="bg-transparent font-serif text-4xl tracking-wider text-ink"
      />
      <h1 className="font-serif text-3xl tracking-[0.08em] text-balance uppercase sm:text-5xl sm:tracking-[0.14em]">
        {header.name}
      </h1>
      {header.tagline && (
        <p className="mt-3 font-serif text-lg text-pretty text-muted italic sm:text-xl">
          {header.tagline}
        </p>
      )}
      <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        {header.location && (
          <li className="inline-flex items-center gap-1.5 text-muted">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            <span>{header.location}</span>
          </li>
        )}
        {header.links.map((item) => (
          <li key={item.id} className="max-w-full">
            <HeaderLink link={item} className={contact} />
          </li>
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
      return <p className="text-lg leading-8 whitespace-pre-line">{block.text}</p>;
    case 'skills':
      return (
        <ul className="flex flex-wrap gap-x-2 gap-y-1 text-lg">
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
        <ul className="space-y-6">
          {block.projects.map((project) => (
            <li key={project.id} className="min-w-0">
              <h3 className="font-serif text-xl font-bold">
                {project.href ? (
                  <NewTabLink
                    href={project.href}
                    className={`inline-flex items-baseline gap-1 hover:text-accent-fg ${focusRing}`}
                  >
                    <span className="underline decoration-line underline-offset-4 hover:decoration-accent-fg">
                      {project.name}
                    </span>
                    <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 self-center" />
                  </NewTabLink>
                ) : (
                  project.name
                )}
              </h3>
              {project.description && (
                <p className="mt-1 whitespace-pre-line">{project.description}</p>
              )}
              {project.tags.length > 0 && (
                <p className="mt-1 text-sm text-muted italic">{project.tags.join(', ')}</p>
              )}
            </li>
          ))}
        </ul>
      );
    case 'testimonials':
      return (
        <>
          {block.testimonials.length > 0 ? (
            <ul className="space-y-8">
              {block.testimonials.map((item) => (
                <li key={item.id} className="min-w-0">
                  <figure className="relative ps-9">
                    <span
                      aria-hidden="true"
                      className="absolute start-0 -top-2 font-serif text-6xl leading-none text-accent-fg"
                    >
                      “
                    </span>
                    <blockquote className="font-serif text-xl leading-relaxed whitespace-pre-line italic">
                      {item.message}
                    </blockquote>
                    <figcaption className="mt-3 text-sm">
                      <span aria-hidden="true">— </span>
                      <span className="font-serif font-bold">{item.name}</span>
                      {item.detail && <span className="text-muted">, {item.detail}</span>}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted italic">No testimonials yet.</p>
          )}
          {block.submitTo && (
            <LeaveTestimonial
              slug={block.submitTo}
              buttonClassName={`inline-block border border-ink px-5 py-1.5 font-serif text-sm tracking-widest uppercase transition hover:bg-surface ${focusRing}`}
            />
          )}
        </>
      );
    case 'entries':
      return (
        <ol className="space-y-6">
          {block.entries.map((entry) => (
            <li key={entry.id} className="min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <h3 className="font-serif text-xl font-bold">
                  {entry.title}
                  {entry.subtitle && (
                    <span className="font-normal text-muted italic">, {entry.subtitle}</span>
                  )}
                </h3>
                {entry.start && (
                  <p className="text-sm text-muted tabular-nums sm:shrink-0 sm:whitespace-nowrap">
                    <DateRange
                      start={entry.start}
                      end={entry.end}
                      openEnded={block.variant !== 'custom'}
                    />
                  </p>
                )}
              </div>
              {entry.description && <p className="mt-2 whitespace-pre-line">{entry.description}</p>}
              {entry.href && (
                <p className="mt-2 text-sm">
                  <NewTabLink
                    href={entry.href}
                    context={entry.title}
                    className={`inline-flex items-center gap-1 ${link}`}
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
}

function Section({
  block,
  animate,
  children,
}: {
  block: Block;
  animate: boolean;
  children: ReactNode;
}) {
  return (
    <Reveal enabled={animate}>
      <section aria-labelledby={block.id} className="mt-10">
        <h2
          id={block.id}
          className="border-b border-ink pb-1.5 font-serif text-sm font-bold tracking-[0.25em] uppercase"
        >
          {block.title}
        </h2>
        <div className="mt-5">{children}</div>
      </section>
    </Reveal>
  );
}

function Footer({ footer }: { footer: FooterModel }) {
  return (
    <footer className="mt-14 border-t border-ink pt-5 text-center font-serif text-sm text-muted italic">
      <p>
        © {footer.year} {footer.name}
      </p>
      <p className="mt-1">
        Made {footer.message}{' '}
        <a href={footer.cta.href} className={link}>
          {footer.cta.label}
        </a>
      </p>
    </footer>
  );
}

export default function ClassicTheme({ profile, idPrefix = '' }: ThemeProps) {
  const blocks = buildBlocks(profile, idPrefix);
  return (
    <ThemeWrapper theme="classic" profile={profile}>
      <div className="min-h-screen bg-surface sm:px-6 sm:py-12">
        <div className="mx-auto max-w-3xl bg-page px-5 py-12 sm:rounded-sm sm:border sm:border-line sm:px-12 sm:py-14 sm:shadow-raised">
          <Header header={buildHeader(profile)} />
          <main id={`${idPrefix}main`}>
            {blocks.map((block) => (
              <Section key={block.id} block={block} animate={!idPrefix}>
                <BlockView block={block} />
              </Section>
            ))}
            {blocks.length === 0 && (
              <EmptyPage className="mt-10 text-center font-serif text-muted italic" />
            )}
          </main>
          <Footer footer={buildFooter(profile)} />
        </div>
      </div>
    </ThemeWrapper>
  );
}
