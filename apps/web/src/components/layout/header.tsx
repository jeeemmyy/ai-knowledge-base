'use client';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/supabase-provider';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user, supabase } = useSupabase();
  const router = useRouter();

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/60 px-6">
      <div className="md:hidden">
        <span className="font-serif text-xl font-semibold">Codex</span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
