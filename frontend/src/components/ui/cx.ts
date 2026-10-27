// Joins class names, skipping the ones that are off: cx('a', isOn && 'b').
export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');
