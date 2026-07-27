'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/supabase-provider';
import { useMe } from '@/lib/hooks/use-me';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

/**
 * Protects all nested routes: redirects to /login without a session, and to
 * /verify when the account's email is not yet verified (hard gate).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSupabase();
  const { data: me, isLoading: meLoading, isError: meError } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace('/login');
  }, [session, loading, router]);

  useEffect(() => {
    if (me && !me.emailVerified) router.replace('/verify');
  }, [me, router]);

  // Block until we know the verification status. Fail OPEN if /auth/me errors
  // (e.g. before the migration is applied) so the app is never bricked; block
  // (while redirecting) only when we positively know the user is unverified.
  const blocking =
    loading || !session || (meLoading && !meError) || (me && !me.emailVerified);
  if (blocking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse font-serif text-2xl text-muted-foreground">DocBrain</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
