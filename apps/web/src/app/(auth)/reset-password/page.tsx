'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { accountApi } from '@/lib/api/account';
import { apiErrorMessage } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await accountApi.requestPasswordReset(email.trim());
      setStep('confirm');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await accountApi.confirmPasswordReset(email.trim(), code.trim(), password);
      toast.success('Password updated. Please sign in.');
      router.replace('/login');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not reset password'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Password reset
        </div>
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>
          {step === 'request'
            ? 'Enter your email and we’ll send you a reset code.'
            : 'Enter the code we emailed you and choose a new password.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'request' ? (
          <form onSubmit={requestCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={confirmReset} className="space-y-4">
            <p className="rounded-lg border border-border bg-secondary/60 p-3 text-sm text-muted-foreground">
              If an account exists for {email}, a code is on its way.
            </p>
            <div className="space-y-2">
              <Label htmlFor="code">Reset code</Label>
              <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456" className="text-center tracking-[0.3em]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" autoComplete="new-password" required value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <Button type="submit" className="w-full" disabled={loading || code.length < 4}>
              {loading ? 'Updating…' : 'Set new password'}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
