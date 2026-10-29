// The commands used last, newest first, kept in this browser only. Storage can be missing or throw
// (private windows, blocked site data): then there are simply no recent commands.
const KEY = 'parichay:palette-recent';
const MAX = 6;

export function readRecent(): string[] {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function rememberCommand(id: string): void {
  try {
    const next = [id, ...readRecent().filter((other) => other !== id)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // nothing to do: the list just will not be remembered
  }
}
