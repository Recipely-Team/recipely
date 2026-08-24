import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getLocales } from 'expo-localization';
import { hasKey, isString } from '@core/guards/type-guards';
import { CharConstants, ValueConstants } from '@core/constants';
import type { DeviceProfileType } from '@infrastructure/device/device-profile-type';

/** What a field says when the platform does not publish it. */
const UNKNOWN = 'unknown';

/**
 * Reads the device facts, from whichever of the three sources has them.
 *
 * @remarks
 * - **Only what is actually published, and only from packages this app
 *   declares.** `Constants.isDevice` and `Constants.nativeBuildVersion` read
 *   like the right fields and belong to `expo-device` and `expo-application`,
 *   neither of which is a dependency here — on a real device both are
 *   `undefined`, so "is this real hardware" answered `simulator` on every
 *   phone and the build number was always `unknown`. A field that is silently
 *   constant is worse than an absent one: it reads as an answer.
 * - **The iOS device NAME is not the model.** `Constants.deviceName` is
 *   `UIDevice.name`, which is "Ali's iPhone" on most phones — a person's name,
 *   in a crash console, from a module whose own contract says it identifies
 *   nobody. iOS reports its model through the manifest instead, and `unknown`
 *   when it cannot.
 * - **`Platform.constants` is a union** whose Android half carries `Brand` and
 *   `Model` and whose iOS half does not, so each key is asked for rather than
 *   assumed — the same reason the guards exist (rule 5).
 * - **Nothing here throws.** A profile that failed to build would take the
 *   launch with it, and it is diagnostics.
 */
export const readDeviceProfile = (): DeviceProfileType => {
  const constants: unknown = Platform.constants;
  const ios = Constants.platform?.ios;
  const android = Constants.platform?.android;

  return {
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    brand: readString(constants, 'Brand') ?? readString(constants, 'systemName') ?? UNKNOWN,
    model: readString(constants, 'Model') ?? ios?.model ?? UNKNOWN,
    appVersion: Constants.expoConfig?.version ?? UNKNOWN,
    // The one that never changes for a given binary, which is what a crash
    // report needs: two builds can share a version and differ by this.
    build: ios?.buildNumber ?? android?.versionCode?.toString() ?? UNKNOWN,
    locale: getLocales()[ValueConstants.zero]?.languageTag ?? UNKNOWN,
  };
};

function readString(source: unknown, key: string): string | null {
  if (!hasKey(source, key)) return null;
  const value = source[key];
  return isString(value) && value !== CharConstants.empty ? value : null;
}
