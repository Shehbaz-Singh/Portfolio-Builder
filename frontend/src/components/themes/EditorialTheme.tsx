import type { ReactNode } from 'react';
import { Hanken_Grotesk, Newsreader } from 'next/font/google';
import { MapPin } from 'lucide-react';
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

// A quiet magazine page on warm paper (.theme-editorial). A narrow reading column; a masthead with a
// large serif name between two rules; the About text opens with a drop cap; section labels are small
// capitals on a thin rule; jobs hang their dates in a left column; projects are text, not cards;
// skills run on as a sentence; testimonials are pull quotes. The accent is used sparingly: links,
// the short rule before a label, the drop cap and the quotation marks.
// Newsreader for display, Hanken Grotesk for text.

// preload is off: every theme's fonts are known to the page bundle, and preloading would fetch all
// of them. Only the faces a page draws are downloaded, when it draws them.
const sans = Hanken_Grotesk({ subsets: ['latin'], display: 'swap', preload: false });
const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-theme-display',
  display: 'swap',
  preload: false,
});

const display = 'font-(family-name:--font-theme-display)';
const caps = 'text-xs font-semibold tracking-[0.18em] uppercase';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
const link = `ed-underline text-accent-fg ${focusRing}`;

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
      <section aria-labelledby={block.id} className="mt-16 sm:mt-24">
        <h2 id={block.id} className={`${caps} mb-8 flex items-center gap-4`}>
          <span aria-hidden="true" className="h-px w-8 shrink-0 bg-accent" />
          <span className="min-w-0">{block.title}</span>
          <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-line" />
        </h2>
        {children}
      </section>
    </Reveal>
  );
}

function Masthead({ header }: { header: HeaderModel }) {
  return (
    <header className="rise-in text-center">
      <div className="border-y border-ink py-3">
        <p className={`${caps} flex items-center justify-center gap-1.5 text-muted`}>
          {header.location ? (
            <>
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              <span>{header.location}</span>
            </>
          ) : (
            <span>Portfolio</span>
          )}
        </p>
      </div>
      <Avatar
        avatar={header.avatar}
        className="mx-auto mt-10 size-24 rounded-full"
        placeholderClassName={`${display} border border-ink text-3xl text-ink`}
      />
      <h1
        className={`${display} mt-8 text-[clamp(2.75rem,10vw,5.5rem)] leading-[1.02] font-medium tracking-tight text-balance`}
      >
        {header.name}
      </h1>
      {header.tagline && (
        <p
          className={`${display} mx-auto mt-5 max-w-xl text-xl leading-snug text-pretty text-muted italic sm:text-2xl`}
        >
          {header.tagline}
        </p>
      )}
      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-y border-line py-4 text-sm">
        {header.links.map((item) => (
          <li key={item.id} className="max-w-full">
            <HeaderLink link={item} className={`inline-flex items-center gap-2 ${link}`} />
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
      return (
        <p
          className={`${display} text-xl leading-relaxed whitespace-pre-line first-letter:float-start first-letter:me-3 first-letter:mt-1 first-letter:text-[4.5rem] first-letter:leading-[0.8] first-letter:font-medium first-letter:text-accent-fg sm:text-[1.35rem] sm:leading-[1.7]`}
        >
          {block.text}
        </p>
      );
    case 'skills':
      // Reads as one sentence: the items are inline.
      return (
        <ul className={`${display} text-xl leading-9`}>
          {block.skills.map((skill) => (
            <li key={skill.id} className="inline after:content-[',_'] last:after:content-['.']">
              {skill.name}
            </li>
          ))}
        </ul>
      );
    case 'projects':
      return (
        <ul className="space-y-12">
          {block.projects.map((project) => (
            <li key={project.id} className="ed-hover group relative min-w-0">
              <h3 className={`${display} text-2xl leading-tight font-medium sm:text-3xl`}>
                {project.href ? (
                  <NewTabLink
                    href={project.href}
                    className={`after:absolute after:inset-0 ${focusRing}`}
                  >
                    <span className="ed-underline">{project.name}</span>
                  </NewTabLink>
                ) : (
                  project.name
                )}
              </h3>
              {project.description && (
                <p className="mt-3 leading-relaxed whitespace-pre-line">{project.description}</p>
              )}
              {project.tags.length > 0 && (
                <p className={`${display} mt-3 text-muted italic`}>{project.tags.join(' · ')}</p>
              )}
            </li>
          ))}
        </ul>
      );
    case 'testimonials':
      return (
        <>
          {block.testimonials.length > 0 ? (
            <ul className="space-y-16">
              {block.testimonials.map((item) => (
                <li key={item.id} className="min-w-0">
                  <figure>
                    <span
                      aria-hidden="true"
                      className={`${display} block h-12 text-8xl leading-[0.9] text-accent-fg`}
                    >
                      “
                    </span>
                    <blockquote
                      className={`${display} text-2xl leading-snug whitespace-pre-line italic sm:text-[1.7rem]`}
                    >
                      {item.message}
                    </blockquote>
                    <figcaption className={`${caps} mt-6 text-muted`}>
                      <span className="text-ink">{item.name}</span>
                      {item.detail && <span>, {item.detail}</span>}
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
              buttonClassName={`mt-10 inline-flex items-center text-sm font-medium ${link}`}
            />
          )}
        </>
      );
    case 'entries':
      return (
        <ol className="divide-y divide-line border-y border-line">
          {block.entries.map((entry) => (
            <li
              key={entry.id}
              className={`min-w-0 py-7 ${entry.start ? 'md:grid md:grid-cols-[8.5rem_minmax(0,1fr)] md:gap-8' : ''}`}
            >
              {entry.start && (
                <p className="mb-2 text-sm text-muted tabular-nums md:mt-1.5 md:mb-0">
                  <DateRange
                    start={entry.start}
                    end={entry.end}
                    openEnded={block.variant !== 'custom'}
                  />
                </p>
              )}
              <div className="min-w-0">
                <h3 className={`${display} text-xl leading-snug font-medium sm:text-2xl`}>
                  {entry.title}
                </h3>
                {entry.subtitle && (
                  <p className={`${display} text-lg text-muted italic`}>{entry.subtitle}</p>
                )}
                {entry.description && (
                  <p className="mt-3 leading-relaxed whitespace-pre-line">{entry.description}</p>
                )}
                {entry.href && (
                  <p className="mt-3 text-sm">
                    <NewTabLink href={entry.href} context={entry.title} className={link}>
                      View
                    </NewTabLink>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      );
  }
}

function Footer({ footer }: { footer: FooterModel }) {
  return (
    <footer className="mx-auto max-w-2xl px-5 pb-12 sm:px-8">
      <div
        className={`${display} mt-24 border-t border-ink pt-6 text-center text-sm text-muted italic`}
      >
        <p>
          © {footer.year} {footer.name}
        </p>
        <p className="mt-1">
          Made {footer.message}{' '}
          <a href={footer.cta.href} className={link}>
            {footer.cta.label}
          </a>
        </p>
      </div>
    </footer>
  );
}

export default function EditorialTheme({ profile, idPrefix = '' }: ThemeProps) {
  const blocks = buildBlocks(profile, idPrefix);
  return (
    <ThemeWrapper
      theme="editorial"
      profile={profile}
      className={`${sans.className} ${serif.variable}`}
    >
      <main id={`${idPrefix}main`} className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-16">
        <Masthead header={buildHeader(profile)} />
        {blocks.map((block) => (
          <Section key={block.id} block={block} animate={!idPrefix}>
            <BlockView block={block} />
          </Section>
        ))}
        {blocks.length === 0 && (
          <EmptyPage className={`${display} mt-16 text-center text-muted italic`} />
        )}
      </main>
      <Footer footer={buildFooter(profile)} />
    </ThemeWrapper>
  );
}
