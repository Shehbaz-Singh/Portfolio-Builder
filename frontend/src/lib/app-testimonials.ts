// Quotes about Portfolio Generator itself, shown on the login and register pages.
// PLACEHOLDERS: replace these with real feedback from real users (and their permission) before
// launch. Keep each quote short: it sits in a card.
export interface AppTestimonial {
  quote: string;
  name: string;
  role: string;
}

export const APP_TESTIMONIALS: AppTestimonial[] = [
  {
    quote:
      'I had a clean portfolio online in under ten minutes. The resume import did most of the work.',
    name: 'Placeholder Name',
    role: 'Frontend developer',
  },
  {
    quote: 'Switching themes without retyping anything is great. My page finally looks like me.',
    name: 'Placeholder Name',
    role: 'Product designer',
  },
  {
    quote: 'I send one link in every application now, and recruiters actually mention the page.',
    name: 'Placeholder Name',
    role: 'Recent graduate',
  },
  {
    quote: 'Reordering sections by dragging was so easy. I rearranged my whole page in a minute.',
    name: 'Placeholder Name',
    role: 'Data analyst',
  },
  {
    quote: 'The dark theme looks sharp, and the accent color made it feel like my own brand.',
    name: 'Placeholder Name',
    role: 'Mobile developer',
  },
  {
    quote: 'No code, no hosting headaches. I just filled in my details and shared the link.',
    name: 'Placeholder Name',
    role: 'Freelance writer',
  },
];
