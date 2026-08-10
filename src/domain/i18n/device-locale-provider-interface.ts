/**
 * Port for reading the device's preferred UI language. Implemented in the
 * infrastructure layer (expo-localization) and resolved through the DI
 * container, so no layer above depends on a concrete platform API.
 *
 * The device language is only ever a *seed*: it is used when the user has not
 * picked a language yet. A stored preference always wins over it.
 */
export interface DeviceLocaleProviderInterface {
  /** The device's language code (e.g. `tr`), unvalidated against the app's supported set. */
  getDeviceLocale(): string;
}
