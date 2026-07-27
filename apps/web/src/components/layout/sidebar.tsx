'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, MessagesSquare, Plus, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/hooks/use-me';

const baseNav = [
  { href: '/chat', label: 'Chat', icon: MessagesSquare },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: me } = useMe();
  const nav = me?.isAdmin
    ? [...baseNav, { href: '/admin', label: 'Admin', icon: Shield }]
    : baseNav;
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/60 md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <span className="font-serif text-2xl font-semibold tracking-tight">DocBrain</span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          beta
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
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
      </nav>

      <div className="p-3">
        <Button asChild className="w-full justify-start gap-2">
          <Link href="/documents/new">
            <Plus className="h-4 w-4" />
            New document
          </Link>
        </Button>
      </div>
    </aside>
  );
}
