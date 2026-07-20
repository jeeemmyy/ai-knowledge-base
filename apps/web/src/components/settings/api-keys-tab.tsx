'use client';
import { useState } from 'react';
import { Copy, KeyRound, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ApiKey } from '@repo/shared';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/lib/hooks/use-api-keys';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export function ApiKeysTab() {
  const { data: keys, isLoading, isError } = useApiKeys();
  const create = useCreateApiKey();
  const revoke = useRevokeApiKey();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  function handleCreate() {
    create.mutate(
      { name: name.trim() || undefined },
      {
        onSuccess: (result) => {
          setCreatedKey(result.key);
          setName('');
        },
      },
    );
  }

  async function copyKey() {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    toast.success('API key copied');
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreatedKey(null);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>API keys</CardTitle>
          <CardDescription>
            Call the DocBrain API from external apps (e.g. Bubble) with an{' '}
            <code className="font-mono text-xs">X-API-Key</code> header. Keys act as your account.
          </CardDescription>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create key
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-24 rounded-xl" />}

        {isError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Could not load your API keys. Make sure the API is running and try again.
          </p>
        )}

        {keys && keys.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <KeyRound className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              No API keys yet. Create one to connect an external frontend or script.
            </p>
          </div>
        )}

        {keys && keys.length > 0 && (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {keys.map((key) => (
              <li key={key.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{key.name}</div>
                  <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {key.keyPrefix}…&nbsp;·&nbsp;created{' '}
                    {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt
                      ? ` · last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                      : ' · never used'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-2 text-destructive hover:text-destructive"
                  onClick={() => setRevokeTarget(key)}
                >
                  <Trash2 className="h-4 w-4" />
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* Create dialog: form first, then the one-time key reveal. */}
      <Dialog open={createOpen} onOpenChange={(v) => (v ? setCreateOpen(true) : closeCreate())}>
        <DialogContent>
          {createdKey === null ? (
            <>
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>
                  Give the key a name so you can recognize it later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g. Bubble app"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeCreate} disabled={create.isPending}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={create.isPending}>
                  {create.isPending ? 'Creating…' : 'Create key'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Copy your API key</DialogTitle>
                <DialogDescription>
                  This is the only time the full key is shown. Store it somewhere safe — if you
                  lose it, revoke it and create a new one.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-lg bg-secondary p-3 font-mono text-xs">
                  {createdKey}
                </code>
                <Button variant="outline" size="sm" className="shrink-0 gap-2" onClick={copyKey}>
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={closeCreate}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <Dialog open={revokeTarget !== null} onOpenChange={(v) => !v && setRevokeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API key?</DialogTitle>
            <DialogDescription>
              “{revokeTarget?.name}” ({revokeTarget?.keyPrefix}…) will stop working immediately.
              This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeTarget(null)}
              disabled={revoke.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={revoke.isPending}
              onClick={() => {
                if (!revokeTarget) return;
                revoke.mutate(revokeTarget.id, { onSuccess: () => setRevokeTarget(null) });
              }}
            >
              {revoke.isPending ? 'Revoking…' : 'Revoke'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
