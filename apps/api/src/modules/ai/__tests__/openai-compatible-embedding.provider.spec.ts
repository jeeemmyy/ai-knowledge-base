import { OpenAICompatibleEmbeddingProvider } from '../providers/openai-compatible/openai-compatible-embedding.provider';

// Mock the OpenAI SDK so no network call happens.
const createMock = jest.fn();
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: class {
      embeddings = { create: createMock };
    },
  };
});

describe('OpenAICompatibleEmbeddingProvider', () => {
  const baseConfig = {
    baseURL: 'http://test/v1',
    apiKey: 'k',
    model: 'text-embedding-3-small',
    dimensions: 3,
  };

  beforeEach(() => createMock.mockReset());

  it('returns vectors in input order', async () => {
    createMock.mockResolvedValue({
      data: [
        { index: 1, embedding: [0.4, 0.5, 0.6] },
        { index: 0, embedding: [0.1, 0.2, 0.3] },
      ],
    });
    const provider = new OpenAICompatibleEmbeddingProvider(baseConfig);
    const out = await provider.embed(['a', 'b']);
    expect(out).toEqual([
      [0.1, 0.2, 0.3],
      [0.4, 0.5, 0.6],
    ]);
  });

  it('exposes configured dimensions', () => {
    const provider = new OpenAICompatibleEmbeddingProvider(baseConfig);
    expect(provider.dimensions).toBe(3);
  });

  it('throws on dimension mismatch', async () => {
    createMock.mockResolvedValue({ data: [{ index: 0, embedding: [0.1, 0.2] }] });
    const provider = new OpenAICompatibleEmbeddingProvider(baseConfig);
    await expect(provider.embed('x')).rejects.toThrow(/dimension mismatch/i);
  });

  it('short-circuits on empty input without calling the provider', async () => {
    const provider = new OpenAICompatibleEmbeddingProvider(baseConfig);
    const out = await provider.embed([]);
    expect(out).toEqual([]);
    expect(createMock).not.toHaveBeenCalled();
  });
});
