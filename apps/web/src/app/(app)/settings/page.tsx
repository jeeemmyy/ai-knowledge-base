'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProfileTab } from '@/components/settings/profile-tab';
import { ApiKeysTab } from '@/components/settings/api-keys-tab';

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'api', label: 'API' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('profile');

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <div className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Account
          </div>
          <h1 className="font-serif text-3xl font-semibold">Settings</h1>
        </div>

        <div className="mb-6 flex gap-1 rounded-lg bg-secondary p-1" role="tablist">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                'flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                tab === id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'profile' ? <ProfileTab /> : <ApiKeysTab />}
      </div>
    </div>
  );
}
