// Quotes about Parichay itself, shown on the landing page and the login and register
// pages.
export interface AppTestimonial {
  quote: string;
  name: string;
  role: string;
}

export const APP_TESTIMONIALS: AppTestimonial[] = [
  {
    quote:
      'I uploaded my resume and most of my page was filled in before I had even picked a theme.',
    name: 'Priya S.',
    role: 'Frontend developer',
  },
  {
    quote: 'Switching themes without retyping anything is great. My page finally looks like me.',
    name: 'Harpreet K.',
    role: 'Product designer',
  },
  {
    quote: 'I put one link in every application now. It is so much easier than attaching a PDF.',
    name: 'Kavya N.',
    role: 'Recent graduate',
  },
  {
    quote: 'Reordering sections by dragging was easy. I rearranged my whole page in a minute.',
    name: 'Rohan D.',
    role: 'Data analyst',
  },
  {
    quote: 'The dark theme looks sharp, and the accent color made it feel like my own brand.',
    name: 'Ishita B.',
    role: 'Mobile developer',
  },
  {
    quote: 'No code and nothing to host. I filled in my details, published and shared the link.',
    name: 'Imran A.',
    role: 'Freelance writer',
  },
];
