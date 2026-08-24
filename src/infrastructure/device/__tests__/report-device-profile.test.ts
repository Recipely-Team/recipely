/**
 * A crash report that names neither the model nor the build leaves the two
 * questions anyone asks first — "which OS" and "only on that device?" —
 * unanswerable for the whole crash list. The profile is gathered once at
 * launch, because Crashlytics flushes what it already holds when the process
 * dies, and a process the OS kills runs no handler at all.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { version: '1.0.44' },
    nativeBuildVersion: '331',
    deviceName: "Recep's Pixel",
    isDevice: true,
  },
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'tr-TR' }],
}));

jest.mock('@infrastructure/firebase/crashlytics-service', () => ({
  setCrashAttributes: jest.fn(),
}));

jest.mock('@infrastructure/firebase/analytics-service', () => ({
  logAnalyticsEvent: jest.fn(async () => undefined),
}));

import { readDeviceProfile } from '@infrastructure/device/device-profile';
import { reportDeviceProfile } from '@infrastructure/device/report-device-profile';
import { setCrashAttributes } from '@infrastructure/firebase/crashlytics-service';
import { logAnalyticsEvent } from '@infrastructure/firebase/analytics-service';
import { AnalyticsEvent } from '@infrastructure/constants/analytics';

describe('the device profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads the build, the locale and the hardware it is running on', () => {
    const profile = readDeviceProfile();

    expect(profile).toMatchObject({
      appVersion: '1.0.44',
      build: '331',
      locale: 'tr-TR',
      hardware: 'physical',
    });
  });

  // Every field is asked for rather than assumed: `Platform.constants` carries
  // `Brand`/`Model` on Android and neither on iOS, and a missing one must read
  // as unknown rather than crash a launch over a diagnostic.
  it('says unknown rather than throwing for what the platform does not publish', () => {
    const profile = readDeviceProfile();

    expect(() => readDeviceProfile()).not.toThrow();
    expect(profile.platform.length).toBeGreaterThan(0);
    expect(profile.brand.length).toBeGreaterThan(0);
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

    expect(logAnalyticsEvent).toHaveBeenCalledWith(
      AnalyticsEvent.deviceProfile,
      expect.objectContaining({ locale: 'tr-TR' }),
    );
  });
});
