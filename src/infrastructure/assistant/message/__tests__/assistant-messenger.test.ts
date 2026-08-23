import { AI_REQUEST_TIMEOUT_MS } from '@infrastructure/constants/api/api-timeouts';
import { AssistantMessenger } from '@infrastructure/assistant/message/assistant-messenger';
import type { HttpClient } from '@infrastructure/network/http/http-client';

/**
 * The text path is a MODEL call, not a lookup.
 *
 * Reported from the web shell: the request was cancelled at ten seconds and
 * the screen said "that did not go through" — for a question the assistant was
 * still working on. The default timeout is for endpoints that answer from a
 * database; the repository already keeps the longer one that AI calls are
 * allowed, and this had never asked for it.
 */
describe('AssistantMessenger', () => {
  const calls: { url: string; config: unknown }[] = [];
  const http = {
    post: async (url: string, _data?: unknown, config?: unknown) => {
      calls.push({ url, config });
      return { ok: true as const, value: { reply: 'tamam' } };
    },
  } as unknown as HttpClient;

  beforeEach(() => {
    calls.length = 0;
  });

  it('allows the model the time an AI request is allowed', async () => {
    await new AssistantMessenger(http).ask('baklava tarifi bul', 'tr');

    expect(calls[0]?.config).toMatchObject({ timeout: AI_REQUEST_TIMEOUT_MS });
  });

  it('asks for appreciably longer than a plain lookup', () => {
    expect(AI_REQUEST_TIMEOUT_MS).toBeGreaterThan(30_000);
  });
});
