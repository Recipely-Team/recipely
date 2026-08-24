/**
 * The native microphone's two answers to "may I listen?".
 *
 * @remarks
 * This is the `.ts` half of a platform pair, and it is the half that runs on a
 * phone — the browser runs `microphone.web.ts`, which shares none of this code.
 * A check in a browser says nothing about either.
 */

import { Microphone } from '@infrastructure/assistant/live/audio/microphone';

interface Probe {
  answer: () => Promise<string>;
  /** Every `setAudioSessionActivity` call, in order — the session is exclusive. */
  sessionActive: boolean[];
  recorderThrows: boolean;
  stopped: number;
}

const probe = (): Probe => (globalThis as never as { __probe: Probe }).__probe;

jest.mock('react-native-audio-api', () => {
  const at = (): Probe => (globalThis as never as { __probe: Probe }).__probe;
  return {
    AudioManager: {
      requestRecordingPermissions: () => at().answer(),
      setAudioSessionOptions: () => undefined,
      setAudioSessionActivity: async (active: boolean) => {
        at().sessionActive.push(active);
      },
    },
    AudioRecorder: class {
      constructor() {
        if (at().recorderThrows) throw new Error('recorder busy');
      }
      onAudioReady(): void {}
      clearOnAudioReady(): void {}
      async start(): Promise<void> {}
      async stop(): Promise<void> {
        at().stopped += 1;
      }
    },
  };
});

beforeEach(() => {
  (globalThis as never as { __probe: Probe }).__probe = {
    answer: () => Promise.resolve('Granted'),
    sessionActive: [],
    recorderThrows: false,
    stopped: 0,
  };
});

describe('Microphone.ensureAccess', () => {
  it('grants when the platform says the word it publishes', async () => {
    expect((await new Microphone().ensureAccess()).ok).toBe(true);
  });

  it('refuses when the user says no', async () => {
    probe().answer = () => Promise.resolve('Denied');

    expect((await new Microphone().ensureAccess()).ok).toBe(false);
  });

  // The Android module reaches for `currentActivity` and force-unwraps it, so
  // an app that is not foregrounded when the call lands gets an exception
  // rather than an answer — out of a method that promises a Result.
  it('refuses rather than throwing when the platform cannot ask at all', async () => {
    probe().answer = () => Promise.reject(new Error('currentActivity is null'));

    await expect(new Microphone().ensureAccess()).resolves.toMatchObject({ ok: false });
  });
});

describe('Microphone capture', () => {
  it('activates the audio session while it records and hands it back on stop', async () => {
    const microphone = new Microphone();

    await microphone.start(16_000, () => undefined);
    expect(probe().sessionActive).toEqual([true]);

    await microphone.stop();

    expect(probe().sessionActive).toEqual([true, false]);
  });

  // The session is exclusive: left active it kills the user's music until the
  // app restarts. `stop()` returns early when the recorder was never assigned —
  // which is exactly the case when the constructor threw — so the failure path
  // has to hand it back itself.
  it('hands the audio session back when the recorder itself fails', async () => {
    probe().recorderThrows = true;

    const result = await new Microphone().start(16_000, () => undefined);

    expect(result.ok).toBe(false);
    expect(probe().sessionActive).toEqual([true, false]);
  });

  // Reporting success and keeping the previous callback sent frames into a
  // closure belonging to a session that had already ended.
  it('replaces the frame callback when started again', async () => {
    const microphone = new Microphone();
    await microphone.start(16_000, () => undefined);

    await microphone.start(16_000, () => undefined);

    expect(probe().stopped).toBe(1);
  });
});
