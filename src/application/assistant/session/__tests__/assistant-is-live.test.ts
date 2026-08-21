import { AssistantStatus } from '@application/assistant/session/assistant-status';
import { assistantIsLive } from '@application/assistant/session/assistant-is-live';

/**
 * Seen on an emulator: the session mint answered 404, the store went to
 * `Unavailable` — and the panel showed a green dot with Mute and End, because
 * three call sites each asked `status !== Idle`. There was no way back to the
 * button that starts a session, for a session that had never started.
 */
describe('assistantIsLive', () => {
  it('is false when voice is unavailable, however it became unavailable', () => {
    expect(assistantIsLive(AssistantStatus.Unavailable)).toBe(false);
  });

  it('is false before anything has been started', () => {
    expect(assistantIsLive(AssistantStatus.Idle)).toBe(false);
  });

  // Abandoning a connection is the one thing a user cannot do if the only
  // control on screen is the one that starts a session.
  it.each([AssistantStatus.Connecting, AssistantStatus.Listening, AssistantStatus.Speaking, AssistantStatus.Working])(
    'is true while %s, so the session can be ended',
    (status) => {
      expect(assistantIsLive(status)).toBe(true);
    },
  );
});
