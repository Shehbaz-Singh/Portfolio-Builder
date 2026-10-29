'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { cx } from '../../ui/cx';
import { useEditor } from '../editor-context';
import { useGo } from '../navigation';
import { useDashboardActions } from './actions';
import { GROUPS, buildCommands, type Command, type Group } from './commands';
import { matchScore } from './fuzzy';
import { readRecent, rememberCommand } from './recent';
import { useIsMac } from './platform';
import { PROBLEMS } from '@/lib/messages';

// The palette itself, loaded the first time it opens. A modal dialog (the page behind it is inert and
// Tab stays inside) holding the ARIA combobox pattern: the input owns the focus and points at the
// highlighted option with aria-activedescendant, so arrow keys move through the list without ever
// leaving the field. It mounts every time it opens, so each opening starts with an empty search.

interface Row {
  command: Command;
  group: Group;
}

const SHORTCUTS: { keys: string[]; what: string }[] = [
  { keys: ['MOD', 'K'], what: 'Open or close the command palette' },
  { keys: ['Esc'], what: 'Close the palette' },
  { keys: ['↑', '↓'], what: 'Move through the results' },
  { keys: ['Home', 'End'], what: 'Jump to the first or last result' },
  { keys: ['Enter'], what: 'Run the highlighted command' },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded-sm border border-line bg-surface px-1.5 py-0.5 font-sans text-xs font-medium text-ink">
      {children}
    </kbd>
  );
}

export default function CommandPalette({
  opener,
  onClose,
}: {
  opener: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const { profile, saveFields, notify, requestJump } = useEditor();
  const go = useGo();
  const getActions = useDashboardActions();
  const mac = useIsMac();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const [view, setView] = useState<'commands' | 'shortcuts'>('commands');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [note, setNote] = useState(''); // why a dimmed command did nothing
  const [recent] = useState(readRecent);
  const base = useId();
  const listId = `${base}-list`;

  // Opens as a modal, and gives the focus back to what had it when the palette goes away.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (!el.open) el.showModal();
    (input.current ?? back.current)?.focus();
    const previous = opener.current;
    return () => {
      if (el.open) el.close();
      if (previous?.isConnected) previous.focus();
    };
  }, [opener]);

  // Showing the shortcuts takes the search field away, so the focus goes to the way back.
  useEffect(() => {
    if (view === 'shortcuts') back.current?.focus();
  }, [view]);

  const commands = useMemo(
    () =>
      buildCommands({
        profile,
        go,
        requestJump,
        saveFields,
        notify,
        actions: getActions,
        showShortcuts: () => setView('shortcuts'),
      }),
    // getActions is stable enough: it reads the registry when a command runs.
    [profile, go, requestJump, saveFields, notify],
  );

  const rows = useMemo<Row[]>(() => {
    const text = query.trim();
    if (!text) {
      const visible = commands.filter((command) => !command.searchOnly);
      const byId = new Map(visible.map((command) => [command.id, command]));
      const recents = recent.flatMap((id) => {
        const command = byId.get(id);
        return command ? [command] : [];
      });
      const taken = new Set(recents.map((command) => command.id));
      return [
        ...recents.map((command): Row => ({ command, group: 'Recent' })),
        ...visible
          .filter((command) => !taken.has(command.id))
          .map((command): Row => ({ command, group: command.group })),
      ];
    }
    const scored = commands.flatMap((command) => {
      const value = matchScore(text, command.title, [
        command.subtitle ?? '',
        command.group,
        ...(command.keywords ?? []),
      ]);
      if (value === null) return [];
      // Commands used before come first among equals.
      return [{ command, score: value + (recent.includes(command.id) ? 15 : 0) }];
    });
    return GROUPS.flatMap((group) =>
      scored
        .filter(({ command }) => command.group === group)
        .sort((a, b) => b.score - a.score)
        .map(({ command }): Row => ({ command, group })),
    );
  }, [commands, query, recent]);

  const current = Math.min(active, Math.max(rows.length - 1, 0));
  const activeId = rows[current] ? `${base}-opt-${current}` : undefined;

  useEffect(() => {
    document.getElementById(activeId ?? '')?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  const run = useCallback(
    (command: Command) => {
      if (command.disabled) {
        setNote(`${command.title}: ${command.disabled}.`);
        return;
      }
      rememberCommand(command.id);
      if (command.keepOpen) {
        void command.run();
        return;
      }
      onClose();
      // After the palette has closed and given the focus back, so a dialog the command opens
      // returns the focus to the same place.
      setTimeout(() => {
        void Promise.resolve(command.run()).catch(() => notify('error', PROBLEMS.tryAgain));
      }, 40);
    },
    [onClose, notify],
  );

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const last = rows.length - 1;
    const move = (to: number) => {
      e.preventDefault();
      setNote('');
      setActive(Math.max(0, Math.min(last, to)));
    };
    switch (e.key) {
      case 'ArrowDown':
        return move(current >= last ? 0 : current + 1);
      case 'ArrowUp':
        return move(current <= 0 ? last : current - 1);
      case 'PageDown':
        return move(current + 8);
      case 'PageUp':
        return move(current - 8);
      case 'Home':
        return e.ctrlKey || e.metaKey ? undefined : move(0);
      case 'End':
        return e.ctrlKey || e.metaKey ? undefined : move(last);
      case 'Enter':
        e.preventDefault();
        if (rows[current]) run(rows[current].command);
        return;
    }
  }

  const status =
    view === 'shortcuts'
      ? 'Keyboard shortcuts'
      : note ||
        (rows.length === 0
          ? `No results for “${query.trim()}”`
          : `${rows.length} ${rows.length === 1 ? 'result' : 'results'}`);

  // Rows come in group order; a heading is drawn where the group changes.
  const grouped: { group: Group; rows: { row: Row; index: number }[] }[] = [];
  rows.forEach((row, index) => {
    const last = grouped.at(-1);
    if (last && last.group === row.group) last.rows.push({ row, index });
    else grouped.push({ group: row.group, rows: [{ row, index }] });
  });

  return (
    // The click is only a mouse shortcut for closing: Escape is the keyboard way (onCancel).
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <dialog
      ref={dialog}
      aria-label="Command palette"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === dialog.current && onClose()}
      className="mx-auto mt-[8dvh] mb-auto w-[calc(100%-1rem)] max-w-xl rounded-card border border-line bg-page p-0 text-ink shadow-overlay backdrop:bg-black/40"
    >
      {view === 'shortcuts' ? (
        <div className="p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setView('commands');
                requestAnimationFrame(() => input.current?.focus());
              }}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 text-sm font-medium hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent-fg"
              ref={back}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to commands
            </button>
          </div>
          <h2 className="type-section mt-2">Keyboard shortcuts</h2>
          <dl className="mt-3 divide-y divide-line">
            {SHORTCUTS.map(({ keys, what }) => (
              <div key={what} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-sm">{what}</dt>
                <dd className="flex shrink-0 items-center gap-1">
                  {keys.map((key) => (
                    <Kbd key={key}>{key === 'MOD' ? (mac ? '⌘' : 'Ctrl') : key}</Kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-muted">
            Inside the Markdown editor, {mac ? '⌘' : 'Ctrl'} K keeps its own meaning. Use the
            “Search or jump to…” button in the top bar there.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 border-b-2 border-line px-3 focus-within:border-accent-fg">
            <Search aria-hidden="true" className="size-5 shrink-0 text-muted" />
            <input
              ref={input}
              type="text"
              role="combobox"
              aria-label="Search commands and your content"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Search or jump to…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
                setNote('');
              }}
              onKeyDown={onKeyDown}
              className="palette-input min-h-12 min-w-0 flex-1 bg-transparent py-2 text-base placeholder:text-muted"
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-control px-2 py-1 text-xs font-medium text-muted hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-fg"
            >
              Esc<span className="sr-only"> to close</span>
            </button>
          </div>

          <div
            ref={list}
            id={listId}
            role="listbox"
            aria-label="Results"
            className="max-h-[min(60dvh,28rem)] overflow-y-auto overscroll-contain p-1.5"
          >
            {grouped.map(({ group, rows: groupRows }) => (
              <div key={group} role="group" aria-labelledby={`${base}-g-${group}`}>
                <p
                  id={`${base}-g-${group}`}
                  className="px-2.5 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase"
                >
                  {group}
                </p>
                {groupRows.map(({ row, index }) => {
                  const { command } = row;
                  const Icon = command.icon;
                  const selected = index === current;
                  return (
                    // The input keeps the focus; the options are reached with the arrow keys and
                    // the mouse. aria-activedescendant on the input names the highlighted one.
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                    <div
                      key={command.id}
                      id={`${base}-opt-${index}`}
                      role="option"
                      tabIndex={-1}
                      aria-selected={selected}
                      aria-disabled={command.disabled ? true : undefined}
                      onClick={() => {
                        setActive(index);
                        run(command);
                      }}
                      onMouseMove={() => selected || setActive(index)}
                      className={cx(
                        'flex min-h-11 cursor-pointer items-center gap-3 rounded-control border-s-4 px-2.5 py-1.5 motion-safe:transition-colors',
                        selected
                          ? 'border-accent-fg bg-accent-soft text-ink'
                          : 'border-transparent hover:bg-surface',
                        command.disabled && 'cursor-not-allowed',
                      )}
                    >
                      {command.swatch ? (
                        <span
                          aria-hidden="true"
                          className="size-5 shrink-0 rounded-full border border-line"
                          style={{ backgroundColor: command.swatch }}
                        />
                      ) : Icon ? (
                        <Icon
                          aria-hidden="true"
                          className={cx('size-5 shrink-0', command.disabled && 'opacity-60')}
                        />
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className={cx('block truncate', command.disabled && 'text-muted')}>
                          {command.title}
                        </span>
                        {(command.disabled || command.subtitle) && (
                          <span className="block truncate text-xs text-muted">
                            {command.disabled ?? command.subtitle}
                          </span>
                        )}
                      </span>
                      {command.disabled && <span className="sr-only">, unavailable</span>}
                    </div>
                  );
                })}
              </div>
            ))}
            {rows.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted">
                No results for “{query.trim()}”.
                <span className="mt-1 block">
                  Try another word, like “theme”, “publish” or the name of a project.
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2 text-xs text-muted max-sm:hidden">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> to move
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Enter</Kbd> to run
            </span>
          </div>
        </div>
      )}
      {/* Announces the number of results as you type, and why a dimmed command did nothing. */}
      <div role="status" aria-live="polite" className="sr-only">
        {status}
      </div>
    </dialog>
  );
}
