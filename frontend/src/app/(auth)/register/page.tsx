import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata: Metadata = { title: 'Create account | Portfolio Generator' };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
