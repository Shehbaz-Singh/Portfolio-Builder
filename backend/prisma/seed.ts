import bcrypt from 'bcrypt';
import { fullProfileInputSchema } from '@portfolio/shared';
import { prisma } from '../src/lib/prisma';

const SAMPLE_EMAIL = 'demo@example.com';
const SAMPLE_PASSWORD = 'Password123!';

const sample = fullProfileInputSchema.parse({
  slug: 'jane-doe',
  fullName: 'Jane Doe',
  tagline: 'Full-stack developer who loves building useful things',
  about:
    'I am a full-stack developer with five years of experience building web apps with React, Node.js and PostgreSQL. I care about clean APIs, accessible interfaces and shipping.',
  location: 'Bengaluru, India',
  theme: 'minimal',
  published: true,
  links: [
    { type: 'github', url: 'https://github.com/janedoe', visible: true },
    { type: 'linkedin', url: 'https://www.linkedin.com/in/janedoe', visible: true },
    { type: 'website', url: 'https://janedoe.dev', visible: true },
    { type: 'email', url: 'jane@example.com', visible: true },
    { type: 'phone', url: '+91 98765 43210', visible: false },
  ],
  skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Prisma', 'Tailwind CSS'].map(
    (name, order) => ({ name, order }),
  ),
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'Acme Corp',
      startDate: '2022-03-01',
      endDate: null,
      description:
        'Lead a team of four building the customer dashboard. Cut page load time by 40%.',
      order: 0,
    },
    {
      title: 'Software Engineer',
      company: 'Globex',
      startDate: '2019-07-01',
      endDate: '2022-02-28',
      description: 'Built REST APIs and internal tools used by 200+ employees.',
      order: 1,
    },
  ],
  projects: [
    {
      name: 'Portfolio Builder',
      url: 'https://github.com/janedoe/portfolio-builder',
      description: 'Generate a public portfolio page from a profile or an uploaded resume.',
      techTags: ['Next.js', 'Express', 'Prisma', 'PostgreSQL'],
      order: 0,
    },
    {
      name: 'Expense Tracker',
      url: null,
      description: 'Personal finance app with charts and CSV export.',
      techTags: ['React', 'Node.js'],
      order: 1,
    },
  ],
  education: [
    {
      degree: 'B.Tech in Computer Science',
      institution: 'National Institute of Technology',
      startDate: '2015-08-01',
      endDate: '2019-05-31',
      order: 0,
    },
  ],
});

async function main() {
  const { links, skills, experience, projects, education, ...profile } = sample;
  const passwordHash = await bcrypt.hash(SAMPLE_PASSWORD, 12);

  // Re-runnable: replace the sample user's profile (children cascade-delete with it).
  await prisma.profile.deleteMany({ where: { user: { email: SAMPLE_EMAIL } } });
  await prisma.profile.deleteMany({ where: { slug: profile.slug } });

  await prisma.user.upsert({
    where: { email: SAMPLE_EMAIL },
    update: { passwordHash },
    create: { email: SAMPLE_EMAIL, passwordHash },
  });

  await prisma.user.update({
    where: { email: SAMPLE_EMAIL },
    data: {
      profile: {
        create: {
          ...profile,
          links: { create: links.map((link, order) => ({ ...link, order })) },
          skills: { create: skills },
          experience: { create: experience },
          projects: { create: projects },
          education: { create: education },
        },
      },
    },
  });

  console.log(`Seeded ${SAMPLE_EMAIL} / ${SAMPLE_PASSWORD} with profile /${profile.slug}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
