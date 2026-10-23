'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from '@portfolio/shared';
import { api } from '@/lib/client-api';
import { schemaResolver } from '@/lib/form';
import { Form, TextField } from '../form-fields';
import { Button } from '../ui';

type Mode = 'login' | 'register';
type Fields = { email: string; password: string; fullName: string };

const copy = {
  login: {
    title: 'Welcome back',
    submit: 'Log in',
    switchText: 'New here?',
    switchLink: { href: '/register', label: 'Create an account' },
  },
  register: {
    title: 'Create your portfolio',
    submit: 'Create account',
    switchText: 'Already have an account?',
    switchLink: { href: '/login', label: 'Log in' },
  },
};

export function AuthForm({ mode, expired = false }: { mode: Mode; expired?: boolean }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const text = copy[mode];

  const form = useForm<Fields, unknown, LoginInput | RegisterInput>({
    resolver: schemaResolver(mode === 'login' ? loginSchema : registerSchema),
    defaultValues: { email: '', password: '', fullName: '' },
  });

  async function onSubmit(values: LoginInput | RegisterInput) {
    // A 401 here means "wrong password", not "session expired", so no redirect.
    await api(`/auth/${mode}`, { method: 'POST', body: values, redirectOn401: false });
    router.replace('/dashboard');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{text.title}</h1>
      {expired && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          Your session has ended. Please log in again.
        </p>
      )}
      <div className="mt-6">
        <Form
          form={form}
          onSubmit={onSubmit}
          codeFields={{ EMAIL_TAKEN: 'email' }}
          submitLabel={text.submit}
        >
          {mode === 'register' && (
            <TextField
              name="fullName"
              label="Full name"
              hint="Shown on your portfolio. Optional, you can change it later."
              autoComplete="name"
            />
          )}
          <TextField name="email" label="Email" type="email" autoComplete="email" />
          <div>
            <TextField
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              hint={mode === 'register' ? 'At least 8 characters.' : undefined}
            />
            <Button
              variant="ghost"
              className="mt-1 !px-2 !py-1 text-xs"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </Button>
          </div>
        </Form>
      </div>
      <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
        {text.switchText}{' '}
        <Link
          href={text.switchLink.href}
          className="font-medium text-indigo-700 underline dark:text-indigo-400"
        >
          {text.switchLink.label}
        </Link>
      </p>
    </div>
  );
}
