'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useFormContext } from 'react-hook-form';
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
type Fields = { email: string; password: string; fullName: string; acceptTerms: boolean };

// The required box on the sign-up form. Both documents open in a new tab, so nothing typed is lost.
function ConsentField() {
  const { register, formState } = useFormContext<Fields>();
  const error = formState.errors.acceptTerms?.message;
  const link = 'font-medium text-accent-fg underline';
  return (
    <div>
      <div className="flex items-start gap-2">
        <input
          id="acceptTerms"
          type="checkbox"
          className="mt-0.5 size-4 rounded border-line accent-accent"
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'acceptTerms-error' : undefined}
          {...register('acceptTerms')}
        />
        <label htmlFor="acceptTerms" className="text-sm">
          I agree to the{' '}
          <Link href="/terms" target="_blank" rel="noopener noreferrer" className={link}>
            Terms<span className="sr-only"> (opens in a new tab)</span>
          </Link>{' '}
          and{' '}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className={link}>
            Privacy Policy<span className="sr-only"> (opens in a new tab)</span>
          </Link>
          <span className="font-normal text-muted"> (required)</span>
        </label>
      </div>
      {error && (
        <p id="acceptTerms-error" role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const copy = {
  login: {
    title: 'Good to see you again',
    submit: 'Log in',
    switchText: 'New here?',
    switchLink: { href: '/register', label: 'Create an account' },
  },
  register: {
    title: 'Let’s build your portfolio',
    submit: 'Create my account',
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
    defaultValues: { email: '', password: '', fullName: '', acceptTerms: false },
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
          For your security we signed you out after a while. Log in again to pick up where you left
          off.
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
              placeholder="e.g. Priya Sharma"
              hint="This is the name on your portfolio. You can change it any time."
              autoComplete="name"
            />
          )}
          <TextField
            name="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <div>
            <TextField
              name="password"
              label="Password"
              required
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              hint={
                mode === 'register'
                  ? 'At least 8 characters. A short phrase you’ll remember works well.'
                  : undefined
              }
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
          {mode === 'register' && <ConsentField />}
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
