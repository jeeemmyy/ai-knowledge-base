'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AdminUser } from '@repo/shared';
import { accountApi } from '@/lib/api/account';
import { apiErrorMessage } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function UsersTable() {
  const qc = useQueryClient();
  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: accountApi.listUsers,
  });

  const toggle = useMutation({
    mutationFn: (u: AdminUser) => accountApi.setUserUnlimited(u.userId, !u.unlimited),
    onSuccess: (list) => {
      qc.setQueryData(['admin-users'], list);
      void qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Access updated');
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to update access')),
  });

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Free accounts get 5 documents and 10 messages (lifetime). Flip a user to unlimited to
          remove all caps.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-40 rounded-xl" />}
        {isError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Could not load users.
          </p>
        )}
        {users && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="py-2 pr-4 font-medium">Documents</th>
                  <th className="py-2 pr-4 font-medium">Messages</th>
                  <th className="py-2 pr-4 font-medium">Access</th>
                  <th className="py-2 pr-0 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} className="border-b border-border/60">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{u.email ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {u.emailVerified ? 'Verified' : 'Unverified'} · joined{' '}
                        {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {u.unlimited ? '∞' : `${u.documentsUsed} / 5`}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {u.unlimited ? '∞' : `${u.messagesUsed} / 10`}
                    </td>
                    <td className="py-3 pr-4">
                      {u.unlimited ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Unlimited
                        </span>
                      ) : (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-0 text-right">
                      <Button
                        variant={u.unlimited ? 'outline' : 'default'}
                        size="sm"
                        disabled={toggle.isPending}
                        onClick={() => toggle.mutate(u)}
                      >
                        {u.unlimited ? 'Make free' : 'Unlock unlimited'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
