'use client';

/**
 * Tracks whether the API server appears to be cold-starting (free-tier hosts
 * spin down when idle). A request that stays unanswered past WAKE_THRESHOLD_MS
 * flips the status to 'waking'; the first response to reach us flips it back.
 * The UI subscribes via useSyncExternalStore (see ServerWakeBanner).
 */
export type ServerStatus = 'ok' | 'waking';

const WAKE_THRESHOLD_MS = 2500;

let status: ServerStatus = 'ok';
const listeners = new Set<() => void>();

let pending = 0;
let wakeTimer: ReturnType<typeof setTimeout> | null = null;

function setStatus(next: ServerStatus): void {
  if (status === next) return;
  status = next;
  listeners.forEach((notify) => notify());
}

export function getServerStatus(): ServerStatus {
  return status;
}

/** SSR snapshot for useSyncExternalStore. */
export function getServerStatusServerSnapshot(): ServerStatus {
  return 'ok';
}

export function subscribeServerStatus(notify: () => void): () => void {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/** Called by the API client when a request is sent. */
export function requestStarted(): void {
  pending += 1;
  if (wakeTimer === null) {
    wakeTimer = setTimeout(() => {
      wakeTimer = null;
      if (pending > 0) setStatus('waking');
    }, WAKE_THRESHOLD_MS);
  }
}

/**
 * Called when a request settles. `reachedServer` is true when any HTTP
 * response arrived (even an error status) — proof the server is awake.
 */
export function requestSettled(reachedServer: boolean): void {
  pending = Math.max(0, pending - 1);
  if (pending === 0 && wakeTimer !== null) {
    clearTimeout(wakeTimer);
    wakeTimer = null;
  }
  if (reachedServer) setStatus('ok');
}
