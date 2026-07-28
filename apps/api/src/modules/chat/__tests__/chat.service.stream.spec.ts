import { ChatService } from '../chat.service';
import type { ChatStreamChunk } from '@repo/shared';

/**
 * Proves the streaming RAG flow end-to-end with a mocked provider (no network):
 * meta first, then one delta per token, then a done event carrying the message
 * persisted from the accumulated text — plus usage logging.
 */
describe('ChatService.streamMessage', () => {
  function build() {
    const conversations = {
      create: jest.fn(async () => ({
        id: 'conv1',
        userId: 'user1',
        title: 'hi',
        createdAt: 'now',
        updatedAt: 'now',
      })),
      getForUser: jest.fn(),
      touch: jest.fn(async () => undefined),
    };
    const messages = {
      insert: jest.fn(async (conversationId: string, role: string, content: string) => ({
        id: role === 'user' ? 'u1' : 'a1',
        conversationId,
        role,
        content,
        sources: [],
        createdAt: 'now',
      })),
      recentByConversation: jest.fn(async () => []),
    };
    const usage = { log: jest.fn(async () => undefined) };
    const prompt = { build: jest.fn(() => [{ role: 'user', content: 'q' }]) };
    const rag = { retrieve: jest.fn(async () => []) };

    async function* fakeStream(): AsyncIterable<ChatStreamChunk> {
      yield { delta: 'Hello' };
      yield { delta: ', world' };
      yield {
        delta: '',
        model: 'mock-model',
        usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 },
      };
    }
    const ai = { stream: jest.fn(() => fakeStream()) };
    const limits = {
      assertCanSendMessage: jest.fn(async () => undefined),
      incrementMessages: jest.fn(async () => undefined),
    };

    const service = new ChatService(
      conversations as never,
      messages as never,
      usage as never,
      prompt as never,
      rag as never,
      ai as never,
      limits as never,
    );
    return { service, conversations, messages, usage, ai, limits };
  }

  const user = { id: 'user1', email: 'user1@example.com', provider: 'email' };

  it('emits meta -> deltas -> done and persists the full answer', async () => {
    const { service, messages, usage } = build();

    const events = [];
    for await (const e of service.streamMessage(user as never, { message: 'hi' })) {
      events.push(e);
    }

    expect(events[0]).toEqual({
      type: 'meta',
      conversationId: 'conv1',
      userMessage: expect.objectContaining({ role: 'user', content: 'hi' }),
    });

    const deltas = events.filter((e) => e.type === 'delta') as { type: 'delta'; text: string }[];
    expect(deltas.map((d) => d.text)).toEqual(['Hello', ', world']);

    const done = events[events.length - 1];
    expect(done.type).toBe('done');
    if (done.type === 'done') {
      expect(done.assistantMessage.content).toBe('Hello, world');
    }

    // Assistant message persisted with the accumulated text.
    expect(messages.insert).toHaveBeenCalledWith('conv1', 'assistant', 'Hello, world', []);
    // Usage logged with the model + tokens from the final chunk.
    expect(usage.log).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model',
        usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 },
      }),
    );
  });

  it('emits an error event (not a throw) when the provider fails', async () => {
    const { service, ai, messages } = build();
    ai.stream.mockImplementationOnce(() => {
      // eslint-disable-next-line require-yield
      async function* boom(): AsyncIterable<ChatStreamChunk> {
        throw new Error('provider down');
      }
      return boom();
    });

    const events = [];
    for await (const e of service.streamMessage(user as never, { message: 'hi' })) {
      events.push(e);
    }

    expect(events.some((e) => e.type === 'error')).toBe(true);
    expect(events.some((e) => e.type === 'done')).toBe(false);
    // No assistant message persisted on failure (only the user message was).
    expect(messages.insert).toHaveBeenCalledTimes(1);
  });
});
