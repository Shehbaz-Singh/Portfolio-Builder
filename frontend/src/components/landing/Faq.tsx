import { ChevronDown } from 'lucide-react';

export const QUESTIONS = [
  {
    q: 'Is it free?',
    a: 'Yes, right now. There is no charge to create, edit or publish a page, and we do not ask for a card. Parichay is a young project, so pricing may change later.',
  },
  {
    q: 'Can I hide parts of my portfolio?',
    a: 'Yes. Every section can be switched off, renamed and reordered. Hiding a section keeps what you wrote in it, so you can bring it back later. A new page also stays private until you switch on Publish.',
  },
  {
    q: 'Who owns my content?',
    a: 'You do. Everything on your page is yours to edit, and you can export it. A resume PDF you upload is not stored: its text is sent to an AI service to be read, and only the result is kept until you save it.',
  },
  {
    q: 'Can I delete my data?',
    a: 'Yes, at any time, from the settings page. Deleting your account removes your profile, posts, testimonials and images. You can also export your data first.',
  },
  {
    q: 'What does Parichay mean?',
    a: 'परिचय (parichay) is the Hindi word for “introduction”, the kind you make when you meet someone. That is what your page is for.',
  },
];

// Native <details>: it opens and closes with the keyboard and works without JavaScript.
export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto max-w-3xl scroll-mt-20 px-5 pb-20 sm:px-8"
    >
      <h2 id="faq-heading" className="type-page text-3xl sm:text-4xl">
        Questions
      </h2>
      <div className="mt-8 divide-y divide-line border-y border-line">
        {QUESTIONS.map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-medium [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="pb-5 text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
