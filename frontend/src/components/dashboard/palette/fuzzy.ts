// Fuzzy matching for the command palette. Every word of the query must match something in the
// command (its title or one of its keywords): as part of a word, or, for longer words, as letters in
// order ("thm" finds "Theme"). A higher score is a better match; null is no match.

const clean = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

// How well one word matches one piece of text.
function wordScore(word: string, text: string): number | null {
  const at = text.indexOf(word);
  if (at !== -1) {
    const wordStart = at === 0 || /[\s\-_/.]/.test(text[at - 1]);
    return (wordStart ? 100 : 60) - Math.min(at, 30) + (text === word ? 40 : 0);
  }
  // Letters in order, close together: only for words long enough that this is not noise.
  if (word.length < 3) return null;
  let from = 0;
  let first = -1;
  let last = -1;
  for (const letter of word) {
    const next = text.indexOf(letter, from);
    if (next === -1) return null;
    if (first === -1) first = next;
    last = next;
    from = next + 1;
  }
  const span = last - first + 1;
  return span <= word.length * 2 ? 30 - (span - word.length) : null;
}

export function matchScore(
  query: string,
  title: string,
  keywords: readonly string[] = [],
): number | null {
  const words = clean(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const texts = [clean(title), ...keywords.map(clean)];
  let total = 0;
  for (const word of words) {
    let best: number | null = null;
    texts.forEach((text, i) => {
      const score = wordScore(word, text);
      // A match in the title counts more than one in a keyword.
      if (score !== null) best = Math.max(best ?? 0, i === 0 ? score + 20 : score);
    });
    if (best === null) return null;
    total += best;
  }
  return total;
}
