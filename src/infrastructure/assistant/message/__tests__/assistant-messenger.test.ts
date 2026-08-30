import { AI_REQUEST_TIMEOUT_MS } from '@infrastructure/constants/api/api-timeouts';
import { ApiLimits } from '@infrastructure/constants/api/api-limits';
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
  const calls: { url: string; data?: unknown; config: unknown }[] = [];
  const http = {
    post: async (url: string, data?: unknown, config?: unknown) => {
      calls.push({ url, data, config });
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

  /**
   * The backend refuses a screen line over its own cap, and typing from the
   * recipe feed was refused every time: the line names the eight rows the user
   * can see, and eight real names measure around 365 characters against a cap
   * that was 200. Nothing failed loudly — the request was rejected before the
   * model saw it and the user was told it had not arrived.
   *
   * Clamped rather than trusted, because the line names recipes and recipe
   * names are written by users: nothing about its length is this app's to
   * promise.
   */
  it('never sends a screen line longer than the backend accepts', async () => {
    const tooLong = 'x'.repeat(ApiLimits.assistantScreenContext * 2);

    await new AssistantMessenger(http).ask('bunu oku', 'tr', tooLong);

    const sent = (calls[0]?.data as { screenContext?: string }).screenContext;
    expect(sent).toHaveLength(ApiLimits.assistantScreenContext);
  });

  it('sends an ordinary feed line through untouched', async () => {
    const line = 'screen=/recipes; recipes=1) Mercimek Çorbası 2) Karnıyarık';

    await new AssistantMessenger(http).ask('bunu oku', 'tr', line);

    expect((calls[0]?.data as { screenContext?: string }).screenContext).toBe(line);
  });
});
