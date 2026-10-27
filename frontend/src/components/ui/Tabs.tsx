'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Badge } from './Badge';
import { cx } from './cx';

export interface TabItem {
  id: string;
  label: string;
  count?: number; // a number shown next to the label (pending items)
  countLabel?: string; // what the number counts, read out after it: "pending"
}

// Tabs over one panel (the children). Tab moves into the row and out of it; inside it the arrow
// keys, Home and End move between tabs, and Enter or Space opens the focused one. Opening is
// manual on purpose: a tab can refuse to open (unsaved changes), so moving past one must not try.
export function Tabs({
  label,
  tabs,
  value,
  onChange,
  idBase,
  children,
}: {
  label: string;
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  idBase: string; // unique on the page: ties each tab to its panel
  children: ReactNode;
}) {
  const list = useRef<HTMLDivElement>(null);

  function onKeyDown(e: KeyboardEvent) {
    const buttons = [...(list.current?.querySelectorAll<HTMLButtonElement>('[role=tab]') ?? [])];
    const at = buttons.findIndex((button) => button === document.activeElement);
    if (at < 0) return;
    const target =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? (at + 1) % buttons.length
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? (at - 1 + buttons.length) % buttons.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? buttons.length - 1
              : -1;
    if (target < 0) return;
    e.preventDefault();
    buttons[target].focus();
  }

  return (
    <>
      {/* The tablist handles arrow keys for the tab buttons inside it; it is not a control. */}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        ref={list}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="mb-6 flex flex-wrap gap-1"
      >
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${idBase}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${idBase}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cx(
                'inline-flex shrink-0 items-center gap-1.5 rounded-control px-3 py-2 text-sm font-medium',
                selected ? 'bg-accent text-on-accent' : 'hover:bg-surface',
              )}
            >
              {tab.label}
              {tab.count ? (
                <Badge tone="solid">
                  {tab.count}
                  {tab.countLabel && <span className="sr-only"> {tab.countLabel}</span>}
                </Badge>
              ) : null}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-tab-${value}`}>
        {children}
      </div>
    </>
  );
}
