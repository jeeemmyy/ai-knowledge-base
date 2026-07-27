'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSupabase } from '@/components/providers/supabase-provider';
import { useMe } from '@/lib/hooks/use-me';
import { accountApi } from '@/lib/api/account';
import { apiErrorMessage } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { supabase, session, loading } = useSupabase();
  const { data: me } = useMe();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const started = useRef(false);

  // Redirect out if not logged in, or already verified.
  useEffect(() => {
    if (!loading && !session) router.replace('/login');
  }, [loading, session, router]);
  useEffect(() => {
    if (me?.emailVerified) router.replace('/chat');
  }, [me, router]);

  // Send the first code once on arrival.
  useEffect(() => {
    if (!session || started.current) return;
    started.current = true;
    accountApi
      .startVerification()
      .then((r) => {
        if (r.alreadyVerified) router.replace('/chat');
        else if (r.sent) setNotice('We emailed you a 6-digit code. Enter it below.');
        else if (r.message) setNotice(r.message);
      })
      .catch((e) => setNotice(apiErrorMessage(e, 'Could not start verification.')));
  }, [session, router]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await accountApi.confirmVerification(code.trim());
      await qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Email verified');
      router.replace('/chat');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Verification failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      const r = await accountApi.startVerification();
      setNotice(r.sent ? 'A new code is on its way.' : (r.message ?? 'Please wait a moment before retrying.'));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not resend code'));
    } finally {
      setResending(false);
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            One more step
          </div>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            {me?.email ? `We sent a code to ${me.email}.` : 'Enter the code we emailed you.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notice && (
            <p className="mb-4 rounded-lg border border-border bg-secondary/60 p-3 text-sm text-muted-foreground">
              {notice}
            </p>
          )}
          <form onSubmit={verify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-lg tracking-[0.4em]"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || code.length < 4}>
              {submitting ? 'Verifying…' : 'Verify email'}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              onClick={resend}
              disabled={resending}
              className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-60"
            >
              {resending ? 'Resending…' : 'Resend code'}
            </button>
            <button onClick={signOut} className="text-muted-foreground underline-offset-4 hover:underline">
              Sign out
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
