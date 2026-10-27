import type { ReactNode } from 'react';

// A template is drawn again on every move between dashboard pages (a layout is not), which is
// what lets the page fade in. The motion itself is in globals.css, and only for people who have
// not asked for less.
export default function DashboardTemplate({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
