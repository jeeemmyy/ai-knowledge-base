'use client';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabase } from '@/components/providers/supabase-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ProfileTab() {
  const { user } = useSupabase();

  async function copyUserId() {
    if (!user?.id) return;
    await navigator.clipboard.writeText(user.id);
    toast.success('User ID copied');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your account details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Email
          </div>
          <div className="mt-1 text-sm">{user?.email}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            User ID
          </div>
          <div className="mt-1 flex items-center gap-2">
            <code className="rounded bg-secondary px-2 py-1 font-mono text-xs">{user?.id}</code>
            <Button variant="ghost" size="sm" className="px-2" onClick={copyUserId} aria-label="Copy user ID">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
