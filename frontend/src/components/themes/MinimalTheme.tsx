import type { ReactNode } from 'react';
import type { PublicProfile } from '@portfolio/shared';
import { formatMonthYear, initials, linkTarget, safeHttpUrl } from '@/lib/format';
import type { ThemeProps } from './types';

// Light and dark follow the visitor's system setting (Tailwind's default `dark:` variant).

const chip =
  'rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200';
const muted = 'text-slate-600 dark:text-slate-400';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-400';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2
        id={id}
        className="mb-5 text-sm font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
      >
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
      // A plain <img>: avatars come from Cloudinary (already 400px) or any host the user chose,
      // which next/image could not allow-list.
      <img
        src={src}
        alt={`Photo of ${profile.fullName}`}
        width={128}
        height={128}
        referrerPolicy="no-referrer"
        className={`${size} object-cover shadow-md ring-4 ring-white dark:ring-slate-950`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${size} flex items-center justify-center bg-indigo-100 text-3xl font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300`}
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
        {profile.tagline && (
          <p className="mt-2 text-lg text-slate-700 dark:text-slate-300">{profile.tagline}</p>
        )}
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
        {links.length > 0 && (
          <ul className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
                  className={`inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 ${focusRing}`}
                >
                  {link.label}
                  {link.external && <span className="sr-only"> (opens in a new tab)</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
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
        className="absolute start-0 top-2 size-3 -translate-x-1/2 rounded-full border-2 border-white bg-indigo-600 dark:border-slate-950 dark:bg-indigo-400"
      />
      <h3 className="font-semibold">{title}</h3>
      <p className={muted}>{subtitle}</p>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-500">
        <time dateTime={start}>{formatMonthYear(start)}</time>
        {' – '}
        {end ? <time dateTime={end}>{formatMonthYear(end)}</time> : 'Present'}
      </p>
      {description && (
        <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-300">{description}</p>
      )}
    </li>
  );
}

export default function MinimalTheme({ profile }: ThemeProps) {
  const { about, skills, experience, projects, education } = profile;

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Header profile={profile} />

        {about && (
          <Section id="about" title="About">
            <p className="leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
              {about}
            </p>
          </Section>
        )}

        {skills.length > 0 && (
          <Section id="skills" title="Skills">
            <ul className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <li key={skill.id} className={chip}>
                  {skill.name}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {experience.length > 0 && (
          <Section id="experience" title="Experience">
            <ol className="border-s border-slate-200 dark:border-slate-800">
              {experience.map((job) => (
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
        )}

        {projects.length > 0 && (
          <Section id="projects" title="Projects">
            <ul className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => {
                const href = safeHttpUrl(project.url);
                return (
                  <li
                    key={project.id}
                    className="relative flex flex-col rounded-xl border border-slate-200 p-5 transition focus-within:border-indigo-400 hover:border-indigo-300 hover:shadow-sm dark:border-slate-800 dark:focus-within:border-indigo-500 dark:hover:border-indigo-500/60"
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
                      <p className={`mt-2 text-sm whitespace-pre-line ${muted}`}>
                        {project.description}
                      </p>
                    )}
                    {project.techTags.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-1.5">
                        {project.techTags.map((tag) => (
                          <li
                            key={tag}
                            className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
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
        )}

        {education.length > 0 && (
          <Section id="education" title="Education">
            <ol className="border-s border-slate-200 dark:border-slate-800">
              {education.map((item) => (
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
        )}
      </main>
    </div>
  );
}
