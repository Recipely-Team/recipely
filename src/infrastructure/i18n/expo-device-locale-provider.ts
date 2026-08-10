import { getLocales } from 'expo-localization';
import type { DeviceLocaleProviderInterface } from '@domain/i18n/device-locale-provider-interface';
import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Reads the device's preferred language via `expo-localization`. The value is
 * returned raw (empty string when the platform reports none) — narrowing it to
 * a language the app actually ships is `LocaleService`'s job, so the supported
 * set stays defined in exactly one place.
 */
export class ExpoDeviceLocaleProvider implements DeviceLocaleProviderInterface {
  getDeviceLocale(): string {
    return getLocales()[ValueConstants.zero]?.languageCode ?? CharConstants.empty;
  }
}
