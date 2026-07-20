'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, LogOut, Menu, MessagesSquare, Plus, X } from 'lucide-react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/chat', label: 'Chat', icon: MessagesSquare },
  { href: '/documents', label: 'Documents', icon: FileText },
];

export function Header() {
  const { user, supabase } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => setMenuOpen(false), [pathname]);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/60 px-4 sm:px-6">
      <div className="flex items-center gap-1 md:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="px-2"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="font-serif text-xl font-semibold">DocBrain</span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

      {menuOpen && (
        <>
          {/* Fixed (not absolute) so the ancestors' overflow-hidden cannot clip it. */}
          <div
            className="fixed inset-x-0 bottom-0 top-16 z-40 bg-foreground/20 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <nav className="fixed inset-x-0 top-16 z-50 border-b border-border bg-card p-3 shadow-md md:hidden">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            <Button asChild className="mt-2 w-full justify-start gap-2">
              <Link href="/documents/new">
                <Plus className="h-4 w-4" />
                New document
              </Link>
            </Button>
          </nav>
        </>
      )}
    </header>
  );
}
