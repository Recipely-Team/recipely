import { recordCrash } from '@infrastructure/firebase/crashlytics-service';
import { silenceDeveloperAlerts } from '@infrastructure/diagnostics/silence-developer-alerts';

jest.mock('@infrastructure/firebase/crashlytics-service', () => ({ recordCrash: jest.fn() }));

/**
 * From the App Store build: "Expo Head: Add the handoff origin to the Expo
 * Config" opened over onboarding, then login, then every screen after it —
 * English developer instructions stacked over a Turkish app, raised by a
 * dependency through the global `alert`, which no app code calls.
 */
describe('a developer dialog in a release build', () => {
  const shown: unknown[] = [];
  let wasDev: boolean;

  beforeEach(() => {
    shown.length = 0;
    wasDev = __DEV__;
    (globalThis as { alert?: unknown }).alert = (message?: unknown) => shown.push(message);
    jest.clearAllMocks();
  });

  afterEach(() => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = wasDev;
    Reflect.deleteProperty(globalThis, 'alert');
  });

  it('never reaches the person using the app, and is reported instead', () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    silenceDeveloperAlerts();

    (globalThis as { alert: (message?: unknown) => void }).alert('Expo Head: Add the handoff origin…');

    expect(shown).toEqual([]);
    expect(recordCrash).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Expo Head') }),
      'silenceDeveloperAlerts',
    );
  });

  // In development the dialog is what a developer wants — and is how this was
  // found in the first place.
  it('is left alone in development', () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    silenceDeveloperAlerts();

    (globalThis as { alert: (message?: unknown) => void }).alert('something a developer should see');

    expect(shown).toEqual(['something a developer should see']);
    expect(recordCrash).not.toHaveBeenCalled();
  });
});
