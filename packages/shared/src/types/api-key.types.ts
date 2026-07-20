/** A user-owned API key for server-to-server access (secret never stored). */
export interface ApiKey {
  id: string;
  name: string;
  /** First characters of the key, for identifying it in lists (e.g. "dbk_a1b2"). */
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

/** Returned once, at creation time — the only moment the secret is visible. */
export interface ApiKeyWithSecret extends ApiKey {
  key: string;
}

export interface CreateApiKeyInput {
  name?: string;
}
