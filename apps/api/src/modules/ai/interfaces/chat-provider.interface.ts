import type { IChatProvider } from '@repo/shared';

export type { IChatProvider } from '@repo/shared';

/** Injection token for the configured chat provider. */
export const CHAT_PROVIDER = Symbol('CHAT_PROVIDER');
export type ChatProviderToken = IChatProvider;
