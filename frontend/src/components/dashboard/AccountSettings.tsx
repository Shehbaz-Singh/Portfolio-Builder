'use client';

import Link from 'next/link';
import { useState } from 'react';
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
import { Button } from '../ui';
import { LoadFailed, Loading } from './screens';

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
      <h2 id="password-heading" className="text-lg font-semibold">
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
          type="password"
          autoComplete="current-password"
        />
        <TextField
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        <TextField
          name="confirmPassword"
          label="Repeat new password"
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
  const form = useForm<DeleteAccountInput, unknown, DeleteAccountInput>({
    resolver: schemaResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  });

  async function onSubmit(values: DeleteAccountInput) {
    await api('/auth/me', { method: 'DELETE', body: values });
    window.location.assign('/'); // the session is gone; start from the front page
  }

  return (
    <section
      aria-labelledby="delete-heading"
      className="space-y-4 rounded-2xl border border-red-300 p-4"
    >
      <h2 id="delete-heading" className="text-lg font-semibold text-red-700">
        Delete account
      </h2>
      <p className="text-sm text-ink">
        This permanently deletes your account, your portfolio and your photo, and your page address
        stops working. It cannot be undone.
      </p>
      {confirming ? (
        <div className="space-y-4 rounded-lg bg-red-50 p-4">
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
              type="password"
              autoComplete="current-password"
            />
          </Form>
        </div>
      ) : (
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Delete my account
        </Button>
      )}
    </section>
  );
}

export function AccountSettings() {
  const { state, retry } = useLoad(loadSession);

  if (state.status === 'loading') return <Loading label="Loading your account…" />;
  if (state.status === 'error') {
    return <LoadFailed title="We couldn't load your account" error={state.error} retry={retry} />;
  }

  return (
    <main className="mx-auto max-w-xl space-y-10 px-4 py-8">
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-accent underline">
          ← Back to editor
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Account settings</h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as <span className="font-medium">{state.data.user.email}</span>
        </p>
      </div>
      <ChangePassword />
      <DeleteAccount />
    </main>
  );
}
