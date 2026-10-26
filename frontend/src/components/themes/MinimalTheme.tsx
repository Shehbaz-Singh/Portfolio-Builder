import type { ReactElement, ReactNode } from 'react';
import {
  SECTION_LABELS,
  customIdOf,
  isCustomKey,
  type PublicCustomItem,
  type PublicCustomSection,
  type PublicProfile,
  type SectionKey,
} from '@portfolio/shared';
import { SITE_URL } from '@/lib/config';
import { formatMonthYear, initials, linkTarget, safeHttpUrl } from '@/lib/format';
import { ShareButton } from '../ShareButton';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';

const chip = 'rounded-full bg-surface px-3 py-1 text-sm text-ink';
const muted = 'text-muted';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

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

function Avatar({ profile }: { profile: PublicProfile }) {
  const src = safeHttpUrl(profile.avatarUrl);
  const size = 'size-28 shrink-0 rounded-full sm:size-32';

  if (src) {
    return (
      <img
        src={src}
        alt={`Photo of ${profile.fullName}`}
        width={128}
        height={128}
        referrerPolicy="no-referrer"
        className={`${size} object-cover shadow-md ring-4 ring-page`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${size} flex items-center justify-center bg-accent text-3xl font-semibold text-on-accent`}
    >
      {initials(profile.fullName)}
    </div>
  );
}

function Header({ profile }: { profile: PublicProfile }) {
  const links = profile.links.flatMap((link) => {
    const target = linkTarget(link);
    return target ? [{ id: link.id, ...target }] : [];
  });

  return (
    <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:gap-8 sm:text-left">
      <Avatar profile={profile} />
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight break-words sm:text-4xl">
          {profile.fullName}
        </h1>
        {profile.tagline && <p className="mt-2 text-lg text-ink">{profile.tagline}</p>}
        {profile.location && (
          <p
            className={`mt-2 flex items-center justify-center gap-1.5 text-sm sm:justify-start ${muted}`}
          >
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
            <span>{profile.location}</span>
          </p>
        )}
        <ul className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={link.href}
                {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
                className={`inline-flex items-center rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:bg-surface ${focusRing}`}
              >
                {link.label}
                {link.external && <span className="sr-only"> (opens in a new tab)</span>}
              </a>
            </li>
          ))}
          <li>
            <ShareButton
              url={`${SITE_URL}/${profile.slug}`}
              title={`${profile.fullName}'s portfolio`}
            />
          </li>
        </ul>
      </div>
    </header>
  );
}

function TimelineItem({
  title,
  subtitle,
  start,
  end,
  description,
}: {
  title: string;
  subtitle: string;
  start: string;
  end: string | null;
  description?: string;
}) {
  return (
    <li className="relative pb-8 ps-6 last:pb-0">
      <span
        aria-hidden="true"
        className="absolute start-0 top-2 size-3 -translate-x-1/2 rounded-full border-2 border-page bg-accent"
      />
      <h3 className="font-semibold">{title}</h3>
      <p className={muted}>{subtitle}</p>
      <p className="mt-0.5 text-sm text-muted">
        <time dateTime={start}>{formatMonthYear(start)}</time>
        {' – '}
        {end ? <time dateTime={end}>{formatMonthYear(end)}</time> : 'Present'}
      </p>
      {description && <p className="mt-2 whitespace-pre-line text-ink">{description}</p>}
    </li>
  );
}

interface SectionProps {
  profile: PublicProfile;
  title: string; // the owner's heading, or the default one
}

// One component per kind of section. Each draws nothing when it has no content, so a section
// that is switched on but empty leaves no heading behind.
function AboutSection({ profile, title }: SectionProps) {
  if (!profile.about) return null;
  return (
    <Section id="about" title={title}>
      <p className="leading-relaxed whitespace-pre-line text-ink">{profile.about}</p>
    </Section>
  );
}

function SkillsSection({ profile, title }: SectionProps) {
  if (profile.skills.length === 0) return null;
  return (
    <Section id="skills" title={title}>
      <ul className="flex flex-wrap gap-2">
        {profile.skills.map((skill) => (
          <li key={skill.id} className={chip}>
            {skill.name}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function ExperienceSection({ profile, title }: SectionProps) {
  if (profile.experience.length === 0) return null;
  return (
    <Section id="experience" title={title}>
      <ol className="border-s border-line">
        {profile.experience.map((job) => (
          <TimelineItem
            key={job.id}
            title={job.title}
            subtitle={job.company}
            start={job.startDate}
            end={job.endDate}
            description={job.description}
          />
        ))}
      </ol>
    </Section>
  );
}

function ProjectsSection({ profile, title }: SectionProps) {
  if (profile.projects.length === 0) return null;
  return (
    <Section id="projects" title={title}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {profile.projects.map((project) => {
          const href = safeHttpUrl(project.url);
          return (
            <li
              key={project.id}
              className="relative flex flex-col rounded-xl border border-line p-5 transition focus-within:border-accent hover:border-accent/50 hover:shadow-sm"
            >
              <h3 className="font-semibold">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`after:absolute after:inset-0 after:rounded-xl ${focusRing}`}
                  >
                    {project.name}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  project.name
                )}
              </h3>
              {project.description && (
                <p className={`mt-2 text-sm whitespace-pre-line ${muted}`}>{project.description}</p>
              )}
              {project.techTags.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {project.techTags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function EducationSection({ profile, title }: SectionProps) {
  if (profile.education.length === 0) return null;
  return (
    <Section id="education" title={title}>
      <ol className="border-s border-line">
        {profile.education.map((item) => (
          <TimelineItem
            key={item.id}
            title={item.degree}
            subtitle={item.institution}
            start={item.startDate}
            end={item.endDate}
          />
        ))}
      </ol>
    </Section>
  );
}

// A section the owner made up (Certifications, Awards, ...): one generic list. Everything in it is
// plain text; the link is the only thing that is not, and it is checked to be http(s).
function CustomItemView({ item }: { item: PublicCustomItem }) {
  const href = safeHttpUrl(item.url);
  return (
    <li>
      <h3 className="font-semibold">{item.title}</h3>
      {item.subtitle && <p className={muted}>{item.subtitle}</p>}
      {item.startDate && (
        <p className="mt-0.5 text-sm text-muted">
          <time dateTime={item.startDate}>{formatMonthYear(item.startDate)}</time>
          {item.endDate && (
            <>
              {' – '}
              <time dateTime={item.endDate}>{formatMonthYear(item.endDate)}</time>
            </>
          )}
        </p>
      )}
      {item.description && <p className="mt-2 whitespace-pre-line text-ink">{item.description}</p>}
      {href && (
        <p className="mt-2">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm font-medium text-accent underline-offset-2 hover:underline ${focusRing}`}
          >
            View
            <span className="sr-only"> {item.title} (opens in a new tab)</span>
          </a>
        </p>
      )}
    </li>
  );
}

function CustomSectionView({ section }: { section: PublicCustomSection }) {
  return (
    <Section id={`custom-${section.id}`} title={section.title}>
      <ul className="space-y-6">
        {section.items.map((item) => (
          <CustomItemView key={item.id} item={item} />
        ))}
      </ul>
    </Section>
  );
}

// Which component draws which built-in section. A new kind of section (testimonials, custom sections) is
// a new key in the shared list plus an entry here; the page itself does not change.
const SECTION_COMPONENTS: Record<SectionKey, (props: SectionProps) => ReactElement | null> = {
  about: AboutSection,
  skills: SkillsSection,
  experience: ExperienceSection,
  projects: ProjectsSection,
  education: EducationSection,
};

export default function MinimalTheme({ profile }: ThemeProps) {
  return (
    <ThemeWrapper profile={profile}>
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Header profile={profile} />

        {/* The order, visibility and headings come from the profile's section config. */}
        {profile.sections.map(({ key, title }) => {
          if (isCustomKey(key)) {
            const section = profile.customSections.find((s) => s.id === customIdOf(key));
            return section ? <CustomSectionView key={key} section={section} /> : null;
          }
          if (!Object.hasOwn(SECTION_COMPONENTS, key)) return null; // not a section this theme knows
          const Component = SECTION_COMPONENTS[key as SectionKey];
          return (
            <Component
              key={key}
              profile={profile}
              title={title ?? SECTION_LABELS[key as SectionKey]}
            />
          );
        })}
      </main>
    </ThemeWrapper>
  );
}
