# Portfolio Generator

Fill in your details once and get a clean, shareable portfolio page at your own link, like `yoursite.com/jane-doe`. No design work and no hosting to set up.

## What it does

**For the person building a portfolio**

- Start from your resume: upload a PDF and the details, links, skills, jobs, education and projects it contains are filled in for you to review, fix and save. Nothing is saved until you say so, and the PDF itself is never stored.
- Sign up, then build your page from a dashboard with a sidebar (a bottom bar on phones): Profile (basics, about, skills, experience, projects, education), Sections, Themes, Testimonials and Settings. A completeness meter suggests what to fill in next, and your changes save automatically.
- See a live preview next to the form while you type, using the same theme your visitors will see, at phone, tablet or desktop width.
- Add links (LinkedIn, GitHub, email, phone, website) and hide any of them with a switch without deleting it.
- Upload a profile photo; it is cropped to a square automatically.
- Drag to reorder links, skills, experience, projects and education. Keyboard reordering works too.
- Choose your own page address, pick one of four themes (Minimal, Dark, Creative or Classic) from a gallery of live previews, and an accent color (with a warning when it is hard to read on that theme).
- Choose which sections your page shows, drag them into the order you want and rename their headings. Hiding a section keeps what you wrote in it.
- Add your own sections (Certifications, Awards, Publications, Volunteering or anything else), each with its own list of items, and place them in the same order as the built-in ones.
- Publish or unpublish with one switch. You get the public link with copy and open buttons, and a warning if your name or About section is still empty. Unpublishing takes the page down immediately.
- Change your password or delete your account from the settings page. Deleting removes the portfolio and photo for good.

**For the people visiting a portfolio**

- A fast, readable page that works on phones, with a Share button (system share sheet, or copy link, LinkedIn, X, WhatsApp and email).
- Proper link previews when the page is shared, with a generated social image showing the name, tagline and photo.
- Unpublished or missing pages look identical, so nobody can tell which names are taken.

## How it is put together

| Part        | What it is                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| `frontend/` | Next.js (App Router), React and Tailwind: the public pages and the editor                             |
| `backend/`  | Express API with PostgreSQL through Prisma, organised as routes, controllers, services and middleware |
| `shared/`   | Zod schemas and types used by both sides, so a field is validated the same way everywhere             |

Photos are stored on Cloudinary. Everything is a TypeScript npm workspace in one repository.

## Design choices worth knowing

- **Login lives in a protected cookie.** The browser never talks to the API directly. The site forwards requests and keeps the login token in an httpOnly cookie, so scripts on the page can never read it.
- **Everything is validated on the server** with the shared schemas, and the API never returns password hashes or other people's data.
- **Built for a sleepy free-tier backend.** Slow responses show a "waking up" message, reads retry automatically, and a failed save keeps what you typed.
- **Public pages are cached briefly** for speed, and the cache is cleared the moment you save, so edits and unpublishing show up at once.
- **Safe by default:** links only accept http(s), email and phone formats, uploads are checked by their actual contents, and login and upload attempts are rate limited per visitor.
