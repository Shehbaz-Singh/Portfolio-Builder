'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useConfirm } from '../ui';
import { useEditor } from './editor-context';

// Moving away from something with edits that would be lost asks first. An autosave that has not
// gone out yet is not asked about: it is sent as the screen closes.
export function useLeaveGuard() {
  const { hasUnsaved } = useEditor();
  const confirm = useConfirm();
  return useCallback(
    async () =>
      !hasUnsaved() ||
      (await confirm({
        title: 'Leave without saving?',
        message: 'You have changes that are not saved. Leave and lose them?',
        confirmLabel: 'Leave',
        cancelLabel: 'Stay',
        danger: true,
      })),
    [hasUnsaved, confirm],
  );
}

// Goes to a dashboard page (and, for the Profile page, one of its tabs), after the leave check.
export function useGo() {
  const router = useRouter();
  const pathname = usePathname();
  const { setTab } = useEditor();
  const canLeave = useLeaveGuard();
  return useCallback(
    async (href: string, tab?: string) => {
      if (!(await canLeave())) return;
      if (tab) setTab(tab);
      if (href !== pathname) router.push(href);
    },
    [canLeave, pathname, router, setTab],
  );
}
