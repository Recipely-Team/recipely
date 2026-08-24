import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getLocales } from 'expo-localization';
import { hasKey, isString } from '@core/guards/type-guards';
import { CharConstants } from '@core/constants';
import type { DeviceProfileType } from '@infrastructure/device/device-profile-type';

/** What a field says when the platform does not publish it. */
const UNKNOWN = 'unknown';

const PHYSICAL = 'physical';
const SIMULATOR = 'simulator';

/**
 * Reads the device facts, from whichever of the three sources has them.
 *
 * `Platform.constants` is a union whose Android half carries `Brand` and
 * `Model` and whose iOS half does not, so each key is asked for rather than
 * assumed — the same reason the guards exist (rule 5). Nothing here throws: a
 * profile that fails to build would take the launch with it, and it is
 * diagnostics.
 */
export const readDeviceProfile = (): DeviceProfileType => {
  const constants: unknown = Platform.constants;

  return {
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    brand: readString(constants, 'Brand') ?? readString(constants, 'systemName') ?? UNKNOWN,
    model: readString(constants, 'Model') ?? Constants.deviceName ?? UNKNOWN,
    appVersion: Constants.expoConfig?.version ?? UNKNOWN,
    build: readString(Constants, 'nativeBuildVersion') ?? UNKNOWN,
    locale: getLocales()[0]?.languageTag ?? UNKNOWN,
    hardware: Constants.isDevice === true ? PHYSICAL : SIMULATOR,
  };
};

function readString(source: unknown, key: string): string | null {
  if (!hasKey(source, key)) return null;
  const value = source[key];
  return isString(value) && value !== CharConstants.empty ? value : null;
}
