import { FileUp, LayoutList, Link2, MessageSquareQuote, Palette, SquarePlus } from 'lucide-react';

const FEATURES = [
  {
    Icon: FileUp,
    title: 'Resume import',
    text: 'Upload a PDF and review what was found. Nothing is saved until you say so, and the PDF itself is not stored.',
  },
  {
    Icon: Palette,
    title: 'Themes and accent colors',
    text: 'Five themes and any accent color. Text colors adjust so your page stays readable.',
  },
  {
    Icon: SquarePlus,
    title: 'Custom sections',
    text: 'Add sections of your own, such as certifications or talks, with their own items.',
  },
  {
    Icon: LayoutList,
    title: 'Sections you control',
    text: 'Show, hide, rename and reorder sections. Hiding one keeps what you wrote in it.',
  },
  {
    Icon: MessageSquareQuote,
    title: 'Testimonials',
    text: 'Let visitors leave a testimonial and approve each one before it appears. Their email is never shown.',
  },
  {
    Icon: Link2,
    title: 'A link to share',
    text: 'Your page lives at its own address, with a copy button and a share menu.',
  },
];

export function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="scroll-mt-20 border-y border-line bg-surface/50 py-16"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 id="features-heading" className="type-page">
          What you get
        </h2>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, text }) => (
            <li key={title} className="rounded-card border border-line bg-page p-card">
              <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-fg">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="type-subsection mt-4">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
