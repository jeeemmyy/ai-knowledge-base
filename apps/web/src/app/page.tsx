'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/supabase-provider';

/** Entry point: route to the app if signed in, otherwise to login. */
export default function IndexPage() {
  const { session, loading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(session ? '/chat' : '/login');
  }, [session, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse font-serif text-2xl text-muted-foreground">Codex</div>
    </div>
  );
}
