import { Platform } from 'react-native';
import { DevicePlatform } from '@domain/notifications/device-platform';

/**
 * The platform the app is running on, asked as a question rather than compared
 * to a string.
 *
 * @remarks
 * - **`Platform.OS === 'web'` appeared 33 times** across infrastructure and
 *   presentation, each spelling the literal out. The string is the same one
 *   `DevicePlatform` already names for the push-token wire format, so there is
 *   now one definition of what "web" is called.
 * - **Predicates, not constants.** A module-level `const IS_WEB` would freeze
 *   at import time, and the suite switches `Platform.OS` at runtime to cover
 *   both shells. These read it on every call so that keeps working.
 */
export const isWeb = (): boolean => Platform.OS === DevicePlatform.Web;

export const isIos = (): boolean => Platform.OS === DevicePlatform.Ios;

export const isAndroid = (): boolean => Platform.OS === DevicePlatform.Android;
