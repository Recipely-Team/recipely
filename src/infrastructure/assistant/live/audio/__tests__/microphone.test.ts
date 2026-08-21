/**
 * The native microphone's two answers to "may I listen?".
 *
 * @remarks
 * This is the `.ts` half of a platform pair, and it is the half that runs on a
 * phone — the browser runs `microphone.web.ts`, which shares none of this code.
 * A check in a browser says nothing about either.
 */

import { Microphone } from '@infrastructure/assistant/live/audio/microphone';

const permission = { answer: (): Promise<string> => Promise.resolve('Granted') };

jest.mock('react-native-audio-api', () => ({
  AudioManager: {
    requestRecordingPermissions: () =>
      (globalThis as never as { __permission: typeof permission }).__permission.answer(),
    setAudioSessionOptions: () => undefined,
    setAudioSessionActivity: async () => undefined,
  },
  AudioRecorder: class {},
}));

beforeEach(() => {
  (globalThis as never as { __permission: typeof permission }).__permission = permission;
  permission.answer = () => Promise.resolve('Granted');
});

describe('Microphone.ensureAccess', () => {
  it('grants when the platform says the word it publishes', async () => {
    expect((await new Microphone().ensureAccess()).ok).toBe(true);
  });

  it('refuses when the user says no', async () => {
    permission.answer = () => Promise.resolve('Denied');

    expect((await new Microphone().ensureAccess()).ok).toBe(false);
  });

  // The Android module reaches for `currentActivity` and force-unwraps it, so
  // an app that is not foregrounded when the call lands gets an exception
  // rather than an answer — out of a method that promises a Result.
  it('refuses rather than throwing when the platform cannot ask at all', async () => {
    permission.answer = () => Promise.reject(new Error('currentActivity is null'));

    await expect(new Microphone().ensureAccess()).resolves.toMatchObject({ ok: false });
  });
});
