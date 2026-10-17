import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Spinner } from '@/components/ui/Skeleton';

export const metadata: Metadata = {
  title: 'Create free account',
  description: 'Join Dash Cloud Gaming free — play instantly in your browser with cloud saves, XP and leaderboards.',
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center"><Spinner size={22} /></div>}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
