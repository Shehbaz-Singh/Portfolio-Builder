// localStorage for small per-browser conveniences (a tour already seen, a celebration already
// shown). It can be missing or throw (private windows, blocked site data), so nothing depends on it:
// a failed read is "not set", a failed write is ignored.
export function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function writeFlag(key: string): void {
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // nothing to do: the worst case is being shown it again
  }
}
