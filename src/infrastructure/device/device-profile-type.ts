/**
 * What is known about the device this build is running on.
 *
 * @remarks
 * - **Every value is a string**, because both sinks it feeds take strings:
 *   Crashlytics custom keys and analytics parameters. A number that arrives as
 *   `null` on one platform would otherwise need a different fallback per field.
 * - **Nothing here identifies a person.** Model, OS, build and locale describe
 *   the machine; there is no id, no token and no name — a crash report is read
 *   by whoever can open the console, and a device is not a user.
 */
export interface DeviceProfileType {
  platform: string;
  osVersion: string;
  brand: string;
  model: string;
  appVersion: string;
  build: string;
  locale: string;
  /** `simulator` for an emulator or a browser, `physical` for real hardware. */
  hardware: string;
}
