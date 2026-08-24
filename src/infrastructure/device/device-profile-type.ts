/**
 * What is known about the device this build is running on.
 *
 * @remarks
 * - **Every value is a string**, because both sinks it feeds take strings:
 *   Crashlytics custom keys and analytics parameters. A number that arrives as
 *   `null` on one platform would otherwise need a different fallback per field.
 * - **Nothing here identifies a person.** Model, OS, build and locale describe
 *   the machine; there is no id, no token and no name — a crash report is read
 *   by whoever can open the console, and a device is not a user. This is a
 *   rule the fields are checked against, not a hope: the iOS device NAME
 *   ("Ali's iPhone") reached this shape once as a stand-in for the model, and
 *   would have shipped a first name to the crash console on every launch.
 */
export interface DeviceProfileType {
  platform: string;
  osVersion: string;
  brand: string;
  model: string;
  appVersion: string;
  build: string;
  locale: string;
}
