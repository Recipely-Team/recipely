/**
 * A crash report that names neither the model nor the build leaves the two
 * questions anyone asks first — which OS, and is it only that device —
 * unanswerable for the whole crash list.
 *
 * Two things this suite exists to stop, both found in review:
 *
 * 1. **Fields that do not exist.** `Constants.isDevice` and
 *    `Constants.nativeBuildVersion` belong to `expo-device` and
 *    `expo-application`, neither of which this app depends on. They are
 *    `undefined` at runtime, so "real hardware?" answered `simulator` on every
 *    phone — and the first version of this test invented both in its mock, which
 *    is how it passed. The mock below is built from the `expo-constants`
 *    surface that actually exists.
 * 2. **A person's name in the crash console.** `Constants.deviceName` is
 *    `UIDevice.name` — "Ali's iPhone" on most phones — and it was the iOS
 *    fallback for the model.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

const DEVICE_NAME = "Ali's iPhone";

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { version: '1.0.44' },
    // Present on the real module, and deliberately NOT read: it is the user's
    // own name on iOS.
    deviceName: DEVICE_NAME,
    platform: { ios: { model: 'iPhone 15', buildNumber: '331' } },
  },
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'tr-TR' }],
}));

jest.mock('@infrastructure/firebase/crashlytics-service', () => ({
  setCrashAttributes: jest.fn(),
}));

jest.mock('@infrastructure/firebase/analytics-service', () => ({
  analyticsService: { logEvent: jest.fn(async () => undefined) },
}));

import { readDeviceProfile } from '@infrastructure/device/device-profile';
import { reportDeviceProfile } from '@infrastructure/device/report-device-profile';
import { setCrashAttributes } from '@infrastructure/firebase/crashlytics-service';
import { analyticsService } from '@infrastructure/firebase/analytics-service';
import { AnalyticsEvent } from '@infrastructure/constants/analytics/analytics-event';

describe('the device profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads the build that a binary cannot change, not just the version', () => {
    const profile = readDeviceProfile();

    expect(profile).toMatchObject({ appVersion: '1.0.44', build: '331', locale: 'tr-TR' });
  });

  it('takes the model from the manifest, never from the device name', () => {
    const profile = readDeviceProfile();

    expect(profile.model).toBe('iPhone 15');
    expect(Object.values(profile)).not.toContain(DEVICE_NAME);
  });

  // The rule the whole shape is checked against, asserted over every value
  // rather than field by field, so a field added later is covered by it too.
  it('sends nothing that names the person holding the device', () => {
    reportDeviceProfile();

    const attributes = jest.mocked(setCrashAttributes).mock.calls[0][0];
    const event = jest.mocked(analyticsService.logEvent).mock.calls[0][1];

    for (const value of [...Object.values(attributes), ...Object.values(event ?? {})]) {
      expect(String(value)).not.toContain(DEVICE_NAME);
    }
  });

  // Every field is asked for rather than assumed: `Platform.constants` carries
  // `Brand`/`Model` on Android and neither on iOS, and a missing one must read
  // as unknown rather than crash a launch over a diagnostic.
  it('says unknown rather than throwing for what the platform does not publish', () => {
    expect(() => readDeviceProfile()).not.toThrow();
    expect(readDeviceProfile().brand.length).toBeGreaterThan(0);
  });

  it('attaches it to every crash report this session files', () => {
    reportDeviceProfile();

    expect(setCrashAttributes).toHaveBeenCalledWith(
      expect.objectContaining({ appVersion: '1.0.44', build: '331' }),
    );
  });

  // The other question, asked across launches rather than inside one report.
  it('records it as one event per launch', () => {
    reportDeviceProfile();

    expect(analyticsService.logEvent).toHaveBeenCalledWith(
      AnalyticsEvent.deviceProfile,
      expect.objectContaining({ locale: 'tr-TR' }),
    );
  });
});
