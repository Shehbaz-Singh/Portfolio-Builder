// The suggested message that goes with a share of the portfolio (the Share menu on the public page
// and in the dashboard). Plain text; the owner writes it, and each language can have its own.

export const SHARE_MESSAGE_MAX = 200;

// Where the page address goes in the message. Optional: a message without it gets the address
// added at the end.
export const SHARE_URL_TOKEN = '{url}';
const TOKEN = /\{url\}/gi;

export interface ShareText {
  // The message with the address in it: WhatsApp, email, and "Copy message with link".
  withUrl: string;
  // The message without the address, for the places that take the address as a separate piece
  // (the system share sheet, X). Empty when the message was only the address.
  withoutUrl: string;
}

// A message could hold anything the owner typed, so the address is put in with a function: a `$`
// in the address must not be read as a replacement pattern.
export function composeShare(
  template: string | null | undefined,
  fallback: string,
  url: string,
): ShareText {
  const base = template?.trim() || fallback.trim();
  // `search` ignores the pattern's lastIndex, which `test` would move on a global pattern.
  if (base.search(TOKEN) === -1) return { withUrl: `${base} ${url}`.trim(), withoutUrl: base };
  const withoutUrl = base
    .replace(TOKEN, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .trim();
  return { withUrl: base.replace(TOKEN, () => url), withoutUrl };
}
