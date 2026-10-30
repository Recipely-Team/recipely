import { isAndroid } from '@infrastructure/constants/platform';
import { LogTag, LogMessage } from '@infrastructure/constants/log-tag';
import { isNonEmptyString } from '@core/guards/type-guards';
import { PermissionStatus } from 'expo-modules-core';
import type * as NotificationsType from 'expo-notifications';
import type { RegisterTokenFn } from '@infrastructure/notifications/register-token-fn';
import { DevicePlatform } from '@domain/notifications/device-platform';

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
 * Never asks for permission: it runs on every launch, and asking there put the
 * system prompt in front of the user on every open until they allowed it.
 * Permission is asked where a feature needs it (a timer, "notify me", the
 * reminders question), and each of those calls `ensurePushRegistration` once
 * it is granted.
 *
 * Fully defensive: any missing capability (Expo Go, no permission, no
 * Google Play services) results in a logged skip rather than a thrown error.
 * The web counterpart (`push-token-registrar.web.ts`) registers via the
 * Firebase JS SDK.
 */
export const registerPushToken = async (register: RegisterTokenFn): Promise<void> => {
  if (!isAndroid()) return;
  try {
    // Lazy, as before: loaded only on Android, and a plain require (as in notification-service) is what Jest can run.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications') as typeof NotificationsType;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== PermissionStatus.GRANTED) return;

    const token = await Notifications.getDevicePushTokenAsync();
    if (!isNonEmptyString(token.data)) return;

    const result = await register(token.data, DevicePlatform.Android);
    if (!result.ok && __DEV__) {
      console.warn(`${LogTag.pushTokenRegistrar} ${LogMessage.deviceTokenRejected}`, result.failure.code);
    }
  } catch (err) {
    // Expo Go or a device without push support — the polled badge still works.
    if (__DEV__) console.warn(`${LogTag.pushTokenRegistrar} ${LogMessage.androidPushSkipped}`, err);
  }
};
