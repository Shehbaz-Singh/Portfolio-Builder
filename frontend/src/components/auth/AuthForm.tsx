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
import { Button, Card } from '../ui';

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
      <h1 className="type-page">{text.title}</h1>
      {expired && (
        <Card tone="warning" padding="sm" role="alert" className="mt-4 text-sm">
          Your session has ended. Please log in again.
        </Card>
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
          <TextField name="email" label="Email" type="email" autoComplete="email" required />
          <div>
            <TextField
              name="password"
              label="Password"
              required
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              hint={mode === 'register' ? 'At least 8 characters.' : undefined}
            />
            <Button
              variant="ghost"
              size="sm"
              className="mt-1"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </Button>
          </div>
        </Form>
      </div>
      <p className="mt-6 text-sm text-muted">
        {text.switchText}{' '}
        <Link href={text.switchLink.href} className="font-medium text-accent-fg underline">
          {text.switchLink.label}
        </Link>
      </p>
    </div>
  );
}
