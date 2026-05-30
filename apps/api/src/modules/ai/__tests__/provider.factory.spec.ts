jest.mock('openai', () => ({ __esModule: true, default: class {} }));

import { createChatProvider } from '../factories/chat-provider.factory';
import { createEmbeddingProvider } from '../factories/embedding-provider.factory';

describe('provider factories', () => {
  const OLD = process.env;
  beforeEach(() => {
    process.env = { ...OLD };
  });
  afterAll(() => {
    process.env = OLD;
  });

  it('builds a chat provider implementing the contract', () => {
    process.env.AI_CHAT_BASE_URL = 'http://test/v1';
    process.env.AI_CHAT_API_KEY = 'k';
    process.env.AI_CHAT_MODEL = 'm';
    const provider = createChatProvider();
    expect(typeof provider.chat).toBe('function');
  });

  it('builds an embedding provider with configured dimensions', () => {
    process.env.AI_EMBEDDING_BASE_URL = 'http://test/v1';
    process.env.AI_EMBEDDING_API_KEY = 'k';
    process.env.AI_EMBEDDING_MODEL = 'text-embedding-3-small';
    process.env.AI_EMBEDDING_DIMENSIONS = '1536';
    const provider = createEmbeddingProvider();
    expect(provider.dimensions).toBe(1536);
    expect(typeof provider.embed).toBe('function');
  });

  it('throws a clear error when required config is missing', () => {
    delete process.env.AI_CHAT_BASE_URL;
    delete process.env.AI_CHAT_API_KEY;
    delete process.env.AI_CHAT_MODEL;
    expect(() => createChatProvider()).toThrow(/Missing required environment variable/);
  });
});
