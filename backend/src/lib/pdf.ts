import { PDFParse } from 'pdf-parse';
import { AppError } from './errors';

// A resume is a page or two; anything past this is not worth the parsing time or the tokens.
const MAX_PAGES = 8;
const PARSE_TIMEOUT_MS = 20_000;
// What is sent to the model at most (roughly 6,000 tokens).
const MAX_TEXT_CHARS = 24_000;

const unreadable = () =>
  new AppError(
    422,
    'UNREADABLE_PDF',
    "We couldn't read that PDF. It may be damaged or password protected.",
  );

// Real PDFs start with "%PDF-" (a few start with junk first, so the first KB is checked).
// A file's declared Content-Type is whatever the client says; this is the actual check.
export const looksLikePdf = (buf: Buffer) => buf.subarray(0, 1024).includes('%PDF-');

// The text of the first pages, with links written as [text](url): a resume often shows the
// word "LinkedIn" while the address is only in the link. Nothing is written to disk.
export async function extractPdfText(pdf: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(pdf) });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      parser.getText({ first: MAX_PAGES, parseHyperlinks: true, pageJoiner: '\n' }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(unreadable()), PARSE_TIMEOUT_MS);
      }),
    ]);
    return tidy(result.text);
  } catch (err) {
    throw err instanceof AppError ? err : unreadable();
  } finally {
    clearTimeout(timer);
    await parser.destroy().catch(() => {});
  }
}

function tidy(text: string): string {
  return text
    .split('\u0000')
    .join('')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}
