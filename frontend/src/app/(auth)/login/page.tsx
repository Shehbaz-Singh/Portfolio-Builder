import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata: Metadata = { title: 'Log in | Portfolio Generator' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;
  return <AuthForm mode="login" expired={expired === '1'} />;
}
