import { FileUp, Palette, Share2 } from 'lucide-react';

const STEPS = [
  {
    Icon: FileUp,
    title: 'Upload your resume or fill in your details',
    text: 'Upload a PDF and what it says is filled in for you to review, or type your details in yourself.',
  },
  {
    Icon: Palette,
    title: 'Choose a theme',
    text: 'Pick one of four looks and an accent color, and see it change in a live preview as you go.',
  },
  {
    Icon: Share2,
    title: 'Publish and share',
    text: 'Switch on Publish and your page is live at its own address. Copy the link and send it anywhere.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="scroll-mt-20 border-y border-line bg-surface/50 py-16"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 id="how-heading" className="type-page">
          How it works
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title} className="rounded-card border border-line bg-page p-card">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-fg">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="text-sm font-semibold text-muted">
                  <span className="sr-only">Step </span>
                  {i + 1}
                </span>
              </div>
              <h3 className="type-subsection mt-4">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
