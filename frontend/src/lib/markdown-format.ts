// What the editor's formatting buttons do to the text of a post. Pure functions over the text and the
// selection, so the textarea code only has to apply the result.
export type Format = 'bold' | 'italic' | 'heading' | 'link' | 'list' | 'quote' | 'code';

export interface Edit {
  text: string;
  start: number; // the selection to restore afterwards
  end: number;
}

// Puts `before` and `after` around the selection (or around a placeholder when nothing is selected,
// which ends up selected, ready to be typed over).
function wrap(
  text: string,
  start: number,
  end: number,
  before: string,
  after: string,
  hint: string,
): Edit {
  const selected = text.slice(start, end) || hint;
  return {
    text: text.slice(0, start) + before + selected + after + text.slice(end),
    start: start + before.length,
    end: start + before.length + selected.length,
  };
}

// Starts every line the selection touches with `prefix`, or takes it off again if they all have it.
function prefixLines(text: string, start: number, end: number, prefix: string): Edit {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const stop = end > start && text[end - 1] === '\n' ? end - 1 : end;
  const found = text.indexOf('\n', stop);
  const lineEnd = found === -1 ? text.length : found;
  const lines = text.slice(lineStart, lineEnd).split('\n');
  const allHave = lines.every((line) => line.startsWith(prefix));
  const changed = lines
    .map((line) => (allHave ? line.slice(prefix.length) : prefix + line))
    .join('\n');
  return {
    text: text.slice(0, lineStart) + changed + text.slice(lineEnd),
    start: lineStart,
    end: lineStart + changed.length,
  };
}

export function applyFormat(text: string, start: number, end: number, format: Format): Edit {
  switch (format) {
    case 'bold':
      return wrap(text, start, end, '**', '**', 'bold text');
    case 'italic':
      return wrap(text, start, end, '_', '_', 'italic text');
    case 'heading':
      return prefixLines(text, start, end, '## ');
    case 'list':
      return prefixLines(text, start, end, '- ');
    case 'quote':
      return prefixLines(text, start, end, '> ');
    case 'code':
      return text.slice(start, end).includes('\n')
        ? wrap(text, start, end, '```\n', '\n```', '')
        : wrap(text, start, end, '`', '`', 'code');
    case 'link': {
      // [text](https://) with the address selected, so pasting or typing replaces it.
      const label = text.slice(start, end) || 'link text';
      const url = 'https://';
      const urlStart = start + label.length + 3;
      return {
        text: `${text.slice(0, start)}[${label}](${url})${text.slice(end)}`,
        start: urlStart,
        end: urlStart + url.length,
      };
    }
  }
}
