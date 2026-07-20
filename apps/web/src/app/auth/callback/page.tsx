'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSupabase } from '@/components/providers/supabase-provider';

/**
 * OAuth landing page. Supabase's browser client (detectSessionInUrl) parses the
 * token from the redirect URL and establishes the session; we wait for it, then
 * forward to the app. Providers redirect here after Google sign-in.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { session, loading } = useSupabase();
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    // Surface an error the provider passed back (e.g. access denied).
    const params = new URLSearchParams(
      window.location.hash.replace(/^#/, '') || window.location.search,
    );
    const err = params.get('error_description') ?? params.get('error');
    if (err) {
      setFailed(err);
      return;
    }
    if (session) {
      router.replace('/chat');
    }
  }, [session, router]);

  // If auth finished resolving and still no session, sign-in didn't complete.
  useEffect(() => {
    if (!loading && !session && !failed) {
      const t = setTimeout(() => {
        if (!session) setFailed('Sign-in did not complete. Please try again.');
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [loading, session, failed]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      {failed ? (
        <div className="text-center">
          <p className="text-sm text-destructive">{failed}</p>
          <Link
            href="/login"
            className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
          <span className="text-sm">Signing you in…</span>
        </div>
      )}
    </div>
  );
}
