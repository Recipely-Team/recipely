import { isAndroid } from '@infrastructure/constants/platform';
import { LogTag, LogMessage } from '@infrastructure/constants/log-tag';
import { isNonEmptyString } from '@core/guards/type-guards';
import { PermissionStatus } from 'expo-modules-core';
import type { RegisterTokenFn } from '@infrastructure/notifications/register-token-fn';

/**
 * Native push registration. Android: `expo-notifications` (already in the
 * build for timer alerts) exposes the device's FCM registration token via
 * `getDevicePushTokenAsync` — Firebase is initialised natively through
 * `@react-native-firebase/app`, so no extra native module is needed. The token
 * is registered with the backend, which pushes through Firebase Admin.
 *
 * iOS stays a no-op: `getDevicePushTokenAsync` returns a raw APNs token there,
 * which the backend's FCM sender cannot address — bridging it requires
 * `@react-native-firebase/messaging` and a native rebuild (out of scope here).
 *
 * Fully defensive: any missing capability (Expo Go, denied permission, no
 * Google Play services) results in a logged skip rather than a thrown error.
 * The web counterpart (`push-token-registrar.web.ts`) registers via the
 * Firebase JS SDK.
 */
export const registerPushToken = async (register: RegisterTokenFn): Promise<void> => {
  if (!isAndroid()) return;
  try {
    const Notifications = await import('expo-notifications');

    const { status: existing } = await Notifications.getPermissionsAsync();
    const status =
      existing === PermissionStatus.GRANTED
        ? existing
        : (await Notifications.requestPermissionsAsync()).status;
    if (status !== PermissionStatus.GRANTED) return;

    const token = await Notifications.getDevicePushTokenAsync();
    if (!isNonEmptyString(token.data)) return;

    const result = await register(token.data, 'android');
    if (!result.ok && __DEV__) {
      console.warn(`${LogTag.pushTokenRegistrar} ${LogMessage.deviceTokenRejected}`, result.failure.code);
    }
  } catch (err) {
    // Expo Go or a device without push support — the polled badge still works.
    if (__DEV__) console.warn(`${LogTag.pushTokenRegistrar} ${LogMessage.androidPushSkipped}`, err);
  }
};
