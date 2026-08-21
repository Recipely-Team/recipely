/**
 * The web half of the microphone pair — the half a browser check exercises and
 * a phone never touches.
 *
 * The prompt lives inside `getUserMedia`, not in `ensureAccess`: the browser
 * offers no way to ask ahead of use. So a refusal surfaces HERE, and only the
 * error's name distinguishes it from a broken device. Reported as anything
 * else, the user who just pressed Block was told to retry a network problem.
 */

import { FailureCode } from '@core/failure/failure-code';
import { Microphone } from '@infrastructure/assistant/live/audio/microphone.web';

const rejectWith = (name: string): void => {
  const error = new Error('denied');
  error.name = name;
  Object.defineProperty(globalThis, 'navigator', {
    value: { mediaDevices: { getUserMedia: () => Promise.reject(error) } },
    configurable: true,
  });
};

describe('web Microphone.start', () => {
  it.each(['NotAllowedError', 'SecurityError'])('reports %s as a refusal', async (name) => {
    rejectWith(name);

    const result = await new Microphone().start(16_000, () => undefined);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.code).toBe(FailureCode.Forbidden);
  });

  it('reports a broken device as something other than a refusal', async () => {
    rejectWith('NotReadableError');

    const result = await new Microphone().start(16_000, () => undefined);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.code).not.toBe(FailureCode.Forbidden);
  });
});
