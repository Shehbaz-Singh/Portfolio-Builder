# Parichay brand

Parichay (परिचय) is Hindi for "introduction". The brand is warm, confident, professional and
human: paper and ink with one clay-colored accent.

## Colors

The tokens live in `frontend/src/app/globals.css` (the `.brand` class on `<body>`). Components use
the Tailwind names (`bg-page`, `text-ink`, `bg-accent`), never raw values.

| Token         | Value     | Use                                                         |
| ------------- | --------- | ----------------------------------------------------------- |
| `page`        | `#FBF7F0` | Background (warm off-white)                                 |
| `surface`     | `#F4EDE2` | Hovered controls, bands of the landing page                 |
| `line`        | `#D8CDBD` | Borders and dividers                                        |
| `ink`         | `#1F1A17` | Text (about 16:1 on the page)                               |
| `muted`       | `#665D54` | Secondary text (about 5.8:1 on the page)                    |
| `accent`      | `#B4492B` | Buttons and fills (white text on it: 5.3:1)                 |
| `accent-fg`   | `#9E3D21` | Accent-colored text and the focus ring (5.5:1 on tinted bg) |
| `accent-soft` | `#F6E4DA` | Tinted panels                                               |

Why terracotta: it reads as fired clay and ink on paper, which suits a personal introduction, and
it sits far from the blue and purple of most SaaS products. Avoid default blue buttons, purple
gradients and stock illustrations.

Portfolio themes and the accent a user picks for their own page are separate from the brand: a
theme redefines every color variable on its own wrapper, so the brand never leaks into a visitor's
page.

## Fonts

- **Fraunces** (display serif): headings. Use the `type-hero` and `type-page` roles or `font-display`.
- **Hanken Grotesk**: body and UI text.
- **Noto Serif Devanagari**: only the word परिचय, and only on the landing page.

All load through `next/font` in `frontend/src/app/layout.tsx`.

## The logo

For now the wordmark is plain text: `frontend/src/components/Logo.tsx`. Every place that shows the
brand uses that one component, so the real logo is a one-file change.

## Voice

- **Friendly and direct.** Talk to one person: "your page", "you". Say what happens.
- **Plain language.** Short sentences, common words. "Upload", not "leverage". "Delete", not "deprovision".
- **No hype.** No "revolutionary", "supercharge" or "seamless". No superlatives we cannot back up.
- **Honest.** Say only what the product does today. No invented user counts, testimonials, company
  logos or awards. If something might change (such as pricing), say so.
- **Calm about data.** Explain what we keep, why, and how to leave. Never bury it.
- **Errors help.** Say what went wrong and what to do next, without blame.

| Instead of                           | Write                               |
| ------------------------------------ | ----------------------------------- |
| "Unlock your professional presence!" | "Introduce yourself properly."      |
| "Submit"                             | "Create your Parichay"              |
| "An error occurred"                  | "We couldn't save that. Try again." |
