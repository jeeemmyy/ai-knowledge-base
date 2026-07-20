'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import {
  getServerStatus,
  getServerStatusServerSnapshot,
  subscribeServerStatus,
} from '@/lib/api/server-status';

/**
 * Floating notice shown while the API server is cold-starting (free-tier
 * hosting spins down when idle). Also fires a warm-up /health ping on first
 * load so the server starts waking before the user's first real action.
 */
export function ServerWakeBanner() {
  const status = useSyncExternalStore(
    subscribeServerStatus,
    getServerStatus,
    getServerStatusServerSnapshot,
  );

  useEffect(() => {
    api.get('/health').catch(() => {
      // Ignore — the interceptors already track reachability.
    });
  }, []);

  if (status !== 'waking') return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
    >
      <div className="flex items-center gap-2.5 rounded-full border bg-card px-4 py-2 text-sm text-card-foreground shadow-md">
        <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
        <span>
          Waking up the server — free hosting sleeps when idle. This can take up
          to a minute.
        </span>
      </div>
    </div>
  );
}
