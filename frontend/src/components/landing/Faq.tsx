import { ChevronDown } from 'lucide-react';

const QUESTIONS = [
  {
    q: 'Is it free?',
    a: 'Yes. There is no charge to create, edit or publish a portfolio right now.',
  },
  {
    q: 'Can I hide sections?',
    a: 'Yes. Every section can be switched off, renamed and reordered. Hiding a section keeps what you wrote in it, so you can bring it back later.',
  },
  {
    q: 'Who owns my data?',
    a: 'You do. Everything on your portfolio is yours to edit, and you can delete your account at any time, which removes your profile and photo. A resume PDF you upload is not stored: its text is sent to an AI service to be read, and only the result is kept until you save it.',
  },
  {
    q: 'Is my page public right away?',
    a: 'No. A new portfolio stays private until you switch on Publish, and you can switch it off again whenever you like.',
  },
];

// Native <details>: it opens and closes with the keyboard and works without JavaScript.
export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto max-w-3xl scroll-mt-20 px-5 py-16 sm:px-8"
    >
      <h2 id="faq-heading" className="type-page">
        Questions
      </h2>
      <div className="mt-8 space-y-3">
        {QUESTIONS.map(({ q, a }) => (
          <details key={q} className="group rounded-card border border-line bg-page">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-card font-medium [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="px-card pb-card text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
