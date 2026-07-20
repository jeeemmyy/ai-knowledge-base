'use client';

/**
 * Tracks whether the API server appears to be cold-starting (free-tier hosts
 * spin down when idle). A request that stays unanswered past WAKE_THRESHOLD_MS
 * flips the status to 'waking'; the first response to reach us flips it back.
 * The UI subscribes via useSyncExternalStore (see ServerWakeBanner).
 */
export type ServerStatus = 'ok' | 'waking';

const WAKE_THRESHOLD_MS = 2500;
// If any response arrived within this window, the server is provably awake, so
// a slow request is just slow work (e.g. embedding a document) — not a cold
// start. Kept well under Render's ~15-minute idle-sleep so it can't misjudge a
// server that has actually gone to sleep.
const AWAKE_TTL_MS = 10 * 60 * 1000;

let status: ServerStatus = 'ok';
const listeners = new Set<() => void>();

let pending = 0;
let wakeTimer: ReturnType<typeof setTimeout> | null = null;
let lastReachedAt = 0;

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
      // Only surface the cold-start notice when the server is NOT known to be
      // awake. A recent response means it's up and this request is merely slow.
      const serverKnownAwake = Date.now() - lastReachedAt < AWAKE_TTL_MS;
      if (pending > 0 && !serverKnownAwake) setStatus('waking');
    }, WAKE_THRESHOLD_MS);
  }
}

/**
 * Called when a request settles. `reachedServer` is true when any HTTP
 * response arrived (even an error status) — proof the server is awake.
 */
export function requestSettled(reachedServer: boolean): void {
  pending = Math.max(0, pending - 1);
  if (reachedServer) lastReachedAt = Date.now();
  if (pending === 0 && wakeTimer !== null) {
    clearTimeout(wakeTimer);
    wakeTimer = null;
  }
  if (reachedServer) setStatus('ok');
}
