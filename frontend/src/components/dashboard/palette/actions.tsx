'use client';

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';

// Things the top bar owns (it holds the state of the publish switch and the QR dialog) that the
// command palette also needs to do. The top bar registers them while it is on screen; the palette
// calls them, so there is one implementation and the same confirmation dialogs.
export interface DashboardActions {
  togglePublish: () => void;
  copyUrl: () => void;
  openQr: () => void;
}

const noop = () => {};
const none: DashboardActions = { togglePublish: noop, copyUrl: noop, openQr: noop };

interface Registry {
  current: DashboardActions;
}

const ActionsContext = createContext<Registry | null>(null);

export function DashboardActionsProvider({ children }: { children: ReactNode }) {
  const registry = useRef<DashboardActions>(none);
  const value = useMemo<Registry>(
    () => ({
      get current() {
        return registry.current;
      },
      set current(actions: DashboardActions) {
        registry.current = actions;
      },
    }),
    [],
  );
  return <ActionsContext value={value}>{children}</ActionsContext>;
}

// The top bar calls this with its handlers.
export function useRegisterDashboardActions(actions: DashboardActions) {
  const registry = useContext(ActionsContext);
  useEffect(() => {
    if (!registry) return;
    registry.current = actions;
    return () => {
      registry.current = none;
    };
  });
}

// The palette reads the handlers when a command runs.
export function useDashboardActions(): () => DashboardActions {
  const registry = useContext(ActionsContext);
  return () => registry?.current ?? none;
}
