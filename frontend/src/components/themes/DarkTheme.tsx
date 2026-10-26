import { MinimalLayout } from './MinimalTheme';
import type { ThemeProps } from './types';

// The Minimal layout on a dark palette (.theme-dark in globals.css). The palette comes from the
// profile's theme setting, never from the visitor's system preference.
export default function DarkTheme(props: ThemeProps) {
  return <MinimalLayout {...props} theme="dark" />;
}
