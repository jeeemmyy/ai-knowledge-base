'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useMe } from '@/lib/hooks/use-me';
import { accountApi } from '@/lib/api/account';
import { apiErrorMessage } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersTable } from '@/components/admin/users-table';

export default function AdminPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();

  useEffect(() => {
    if (me && !me.isAdmin) router.replace('/chat');
  }, [me, router]);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: accountApi.getAdminSettings,
    enabled: !!me?.isAdmin,
  });

  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [testTo, setTestTo] = useState('');

  useEffect(() => {
    if (settings) {
      setFromEmail(settings.fromEmail ?? '');
      setFromName(settings.fromName ?? 'DocBrain');
    }
  }, [settings]);
  useEffect(() => {
    if (me?.email) setTestTo((t) => t || me.email!);
  }, [me]);

  const save = useMutation({
    mutationFn: () =>
      accountApi.updateAdminSettings({
        apiKey: apiKey.trim() || undefined,
        fromEmail: fromEmail.trim(),
        fromName: fromName.trim(),
      }),
    onSuccess: () => {
      setApiKey('');
      void qc.invalidateQueries({ queryKey: ['admin-settings'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Email settings saved');
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to save settings')),
  });

  const test = useMutation({
    mutationFn: () => accountApi.sendTestEmail(testTo.trim()),
    onSuccess: () => toast.success('Test email sent — check the inbox'),
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to send test email')),
  });

  if (!me?.isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse font-serif text-2xl text-muted-foreground">DocBrain</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <div className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-primary">Admin</div>
          <h1 className="font-serif text-3xl font-semibold">Email &amp; Brevo</h1>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Brevo</CardTitle>
                <CardDescription>
                  Powers verification and password-reset emails. The API key is stored securely and
                  never shown again after saving.
                </CardDescription>
              </div>
              {settings?.configured ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <XCircle className="h-3.5 w-3.5" /> Not configured
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="key">Brevo API key</Label>
                <Input
                  id="key"
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={settings?.configured ? 'Saved — leave blank to keep' : 'xkeysib-…'}
                />
                <p className="text-xs text-muted-foreground">
                  Free tier is fine (300 emails/day). Create a key under Brevo → SMTP &amp; API → API Keys.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from-email">From email</Label>
                  <Input id="from-email" type="email" value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)} placeholder="you@example.com" />
                  <p className="text-xs text-muted-foreground">Must be a verified sender in Brevo.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-name">From name</Label>
                  <Input id="from-name" value={fromName}
                    onChange={(e) => setFromName(e.target.value)} placeholder="DocBrain" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending ? 'Saving…' : 'Save settings'}
                </Button>
                <div className="ml-auto flex items-end gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="test-to" className="text-xs">Test recipient</Label>
                    <Input id="test-to" type="email" value={testTo}
                      onChange={(e) => setTestTo(e.target.value)} className="h-9 w-56" />
                  </div>
                  <Button variant="outline" onClick={() => test.mutate()}
                    disabled={test.isPending || !settings?.configured}>
                    {test.isPending ? 'Sending…' : 'Send test'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <UsersTable />
      </div>
    </div>
  );
}
