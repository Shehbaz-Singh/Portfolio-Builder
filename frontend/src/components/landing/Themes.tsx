import { Browser } from './Hero';

const THEMES = [
  {
    key: 'editorial',
    name: 'Editorial',
    text: 'A quiet magazine page: serif headings, a drop cap, plenty of space.',
  },
  {
    key: 'bento',
    name: 'Bento',
    text: 'A grid of rounded tiles that adapt to your content, tinted by your accent.',
  },
  { key: 'soft', name: 'Soft', text: 'Friendly pastels, rounded shapes and speech-bubble quotes.' },
  {
    key: 'executive',
    name: 'Executive',
    text: 'A professional two-column resume that prints cleanly.',
  },
  { key: 'creative', name: 'Creative', text: 'Bold type and a header in your accent color.' },
];

export function Themes() {
  return (
    <section
      id="themes"
      aria-labelledby="themes-heading"
      className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 sm:px-8"
    >
      <h2 id="themes-heading" className="type-page">
        Five themes, any accent color
      </h2>
      <p className="mt-3 max-w-2xl text-muted">
        Every theme shows the same content, so you can switch at any time without retyping. These
        are screenshots of an example profile.
      </p>
      <ul className="mt-10 grid gap-8 sm:grid-cols-2">
        {THEMES.map((theme) => (
          <li
            key={theme.key}
            className="sm:[&:last-child:nth-child(odd)]:col-span-2 sm:[&:last-child:nth-child(odd)]:mx-auto sm:[&:last-child:nth-child(odd)]:w-[calc(50%-1rem)]"
          >
            <Browser
              src={`/landing/${theme.key}.jpg`}
              alt={`An example portfolio in the ${theme.name} theme.`}
              sizes="(min-width: 1152px) 540px, (min-width: 640px) 45vw, 100vw"
            />
            <h3 className="type-subsection mt-4">{theme.name}</h3>
            <p className="text-muted">{theme.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
