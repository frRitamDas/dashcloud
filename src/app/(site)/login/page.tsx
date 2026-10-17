import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Spinner } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center"><Spinner size={22} /></div>}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
