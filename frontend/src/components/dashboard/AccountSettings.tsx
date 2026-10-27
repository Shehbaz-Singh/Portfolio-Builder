'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  changePasswordSchema,
  deleteAccountSchema,
  type ChangePasswordInput,
  type DeleteAccountInput,
  type SessionResponse,
} from '@portfolio/shared';
import { api } from '@/lib/client-api';
import { schemaResolver } from '@/lib/form';
import { useLoad } from '@/lib/hooks';
import { Form, TextField } from '../form-fields';
import { Button, Card } from '../ui';
import { LogOutButton } from './Nav';
import { ContentSkeleton, LoadFailed } from './screens';

const loadSession = (signal: AbortSignal) => api<SessionResponse>('/auth/me', { signal });

type PasswordFields = { currentPassword: string; newPassword: string; confirmPassword: string };

function ChangePassword() {
  const [changed, setChanged] = useState(false);
  const form = useForm<PasswordFields, unknown, ChangePasswordInput>({
    resolver: schemaResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(values: ChangePasswordInput) {
    setChanged(false);
    if (values.newPassword !== form.getValues('confirmPassword')) {
      form.setError('confirmPassword', { message: 'The two passwords do not match' });
      return;
    }
    await api('/auth/change-password', {
      method: 'POST',
      body: { currentPassword: values.currentPassword, newPassword: values.newPassword },
    });
    form.reset();
    setChanged(true);
  }

  return (
    <section aria-labelledby="password-heading" className="space-y-4">
      <h2 id="password-heading" className="type-section">
        Change password
      </h2>
      <Form
        form={form}
        onSubmit={onSubmit}
        codeFields={{ INVALID_PASSWORD: 'currentPassword' }}
        submitLabel="Change password"
      >
        <TextField
          name="currentPassword"
          label="Current password"
          required
          type="password"
          autoComplete="current-password"
        />
        <TextField
          name="newPassword"
          label="New password"
          required
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        <TextField
          name="confirmPassword"
          label="Repeat new password"
          required
          type="password"
          autoComplete="new-password"
        />
      </Form>
      <p role="status" className="text-sm font-medium text-green-700">
        {changed ? 'Your password has been changed.' : ''}
      </p>
      <p className="text-xs text-muted">
        Other devices you are logged in on stay logged in until their session expires.
      </p>
    </section>
  );
}

function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  const form = useForm<DeleteAccountInput, unknown, DeleteAccountInput>({
    resolver: schemaResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  });

  // Opening the confirmation moves the keyboard into it; cancelling brings it back to the button.
  useEffect(() => {
    if (confirming) panel.current?.querySelector('input')?.focus();
    else if (wasConfirming.current) openButton.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  async function onSubmit(values: DeleteAccountInput) {
    await api('/auth/me', { method: 'DELETE', body: values });
    window.location.assign('/'); // the session is gone; start from the front page
  }

  return (
    <Card as="section" tone="danger" aria-labelledby="delete-heading" className="space-y-4">
      <h2 id="delete-heading" className="type-section text-danger">
        Delete account
      </h2>
      <p className="text-sm text-ink">
        This permanently deletes your account, your portfolio and your photo, and your page address
        stops working. It cannot be undone.
      </p>
      {confirming ? (
        <Card ref={panel} tone="danger-soft" className="space-y-4">
          <p className="text-sm font-medium">Enter your password to confirm.</p>
          <Form
            form={form}
            onSubmit={onSubmit}
            codeFields={{ INVALID_PASSWORD: 'password' }}
            submitLabel="Yes, delete everything"
            danger
            onCancel={() => {
              setConfirming(false);
              form.reset();
            }}
          >
            <TextField
              name="password"
              label="Password"
              required
              type="password"
              autoComplete="current-password"
            />
          </Form>
        </Card>
      ) : (
        <Button ref={openButton} variant="danger" onClick={() => setConfirming(true)}>
          Delete my account
        </Button>
      )}
    </Card>
  );
}

export function AccountSettings() {
  const { state, retry } = useLoad(loadSession);

  if (state.status === 'loading') return <ContentSkeleton label="Loading your account…" />;
  if (state.status === 'error') {
    return <LoadFailed title="We couldn't load your account" error={state.error} retry={retry} />;
  }

  return (
    <div className="mx-auto max-w-xl space-y-10 py-4">
      <div>
        <h1 className="type-page">Account settings</h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as <span className="font-medium">{state.data.user.email}</span>
        </p>
      </div>
      <ChangePassword />
      <section aria-labelledby="session-heading" className="space-y-3">
        <h2 id="session-heading" className="type-section">
          Log out
        </h2>
        <LogOutButton className="border border-line" />
      </section>
      <DeleteAccount />
    </div>
  );
}
