/**
 * The sentinel exists for the crashes that file no report: a process the system
 * kills outright runs no handler, so the only evidence it ever existed is a
 * session marker that was never cleared. These assert the one distinction the
 * whole idea rests on — backgrounded is a goodbye, gone is not.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

const mockBacking = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string): Promise<string | null> =>
    Promise.resolve(mockBacking.has(key) ? (mockBacking.get(key) as string) : null)),
  setItemAsync: jest.fn((key: string, value: string): Promise<void> => {
    mockBacking.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string): Promise<void> => {
    mockBacking.delete(key);
    return Promise.resolve();
  }),
}));

import { CrashSentinel } from '@infrastructure/firebase/crash-sentinel';

beforeEach(async () => {
  mockBacking.clear();
  await CrashSentinel.disarm();
});

describe('CrashSentinel', () => {
  it('reports nothing when there was no previous session', async () => {
    await expect(CrashSentinel.consumePreviousSession()).resolves.toBeNull();
  });

  // The user left. Nothing is owed, and the next launch must stay quiet — a
  // sentinel that cried wolf on every ordinary exit would be turned off inside
  // a day.
  it('leaves nothing behind when the session backgrounds', async () => {
    await CrashSentinel.arm();
    await CrashSentinel.noteStep('import: navigating to the editor');
    await CrashSentinel.disarm();

    await expect(CrashSentinel.consumePreviousSession()).resolves.toBeNull();
  });

  // The Android bug this was built for: the app is on screen, the user taps
  // "open draft", and the process is gone without ever backgrounding. The next
  // launch is the only chance anyone gets to hear about it, and the step is the
  // whole point of hearing about it.
  it('names the step a session was on when it died without backgrounding', async () => {
    await CrashSentinel.arm();
    await CrashSentinel.noteStep('import: navigating to the editor');

    await expect(CrashSentinel.consumePreviousSession()).resolves.toBe(
      'import: navigating to the editor',
    );
  });

  it('reports a death only once', async () => {
    await CrashSentinel.arm();
    await CrashSentinel.noteStep('import: editor mounted with a draft id');

    await CrashSentinel.consumePreviousSession();
    await expect(CrashSentinel.consumePreviousSession()).resolves.toBeNull();
  });

  // A breadcrumb logged after the goodbye — a timer firing as the app goes
  // away — must not put the marker back and turn a clean exit into a phantom
  // crash on the next launch.
  it('does not re-arm itself on a breadcrumb logged after disarming', async () => {
    await CrashSentinel.arm();
    await CrashSentinel.disarm();
    await CrashSentinel.noteStep('import: draft fetch started');

    await expect(CrashSentinel.consumePreviousSession()).resolves.toBeNull();
  });

  // Coming back from the background and dying is a death where the app ACTUALLY
  // was, not at launch — otherwise every resumed session that crashed would
  // report the same useless "app: launched".
  it('resumes at the step it had reached when re-armed', async () => {
    await CrashSentinel.arm();
    await CrashSentinel.noteStep('import: open-draft tapped');
    await CrashSentinel.disarm();
    await CrashSentinel.arm();

    await expect(CrashSentinel.consumePreviousSession()).resolves.toBe(
      'import: open-draft tapped',
    );
  });
});
