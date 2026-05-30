import { OpenAICompatibleChatProvider } from '../providers/openai-compatible/openai-compatible-chat.provider';

const createMock = jest.fn();
jest.mock('openai', () => ({
  __esModule: true,
  default: class {
    chat = { completions: { create: createMock } };
  },
}));

describe('OpenAICompatibleChatProvider', () => {
  const config = { baseURL: 'http://test/v1', apiKey: 'k', model: 'gpt-test' };
  beforeEach(() => createMock.mockReset());

  it('returns content, model and mapped usage', async () => {
    createMock.mockResolvedValue({
      model: 'gpt-test',
      choices: [{ message: { content: 'hello' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    });
    const provider = new OpenAICompatibleChatProvider(config);
    const res = await provider.chat([{ role: 'user', content: 'hi' }]);
    expect(res.content).toBe('hello');
    expect(res.model).toBe('gpt-test');
    expect(res.usage).toEqual({ promptTokens: 10, completionTokens: 5, totalTokens: 15 });
  });

  it('handles missing usage gracefully', async () => {
    createMock.mockResolvedValue({ model: 'gpt-test', choices: [{ message: { content: 'x' } }] });
    const provider = new OpenAICompatibleChatProvider(config);
    const res = await provider.chat([{ role: 'user', content: 'hi' }]);
    expect(res.usage).toBeUndefined();
  });

  it('respects a per-call model override', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: 'x' } }] });
    const provider = new OpenAICompatibleChatProvider(config);
    await provider.chat([{ role: 'user', content: 'hi' }], { model: 'override-model' });
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ model: 'override-model' }));
  });
});
