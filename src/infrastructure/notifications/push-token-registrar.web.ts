import type { RegisterTokenFn } from '@infrastructure/notifications/register-token-fn';
import { LogTag, LogMessage } from '@infrastructure/constants/log-tag';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getFirebaseApp } from '@infrastructure/firebase/firebase-init.web';
import { ValueConstants } from '@core/constants';
import { DevicePlatform } from '@domain/notifications/device-platform';

/** The global the browser exposes when it supports notifications at all. */
const WEB_NOTIFICATION_API = 'Notification';

// Web push needs a VAPID key (Firebase Console → Cloud Messaging → Web Push
// certificates) and a `firebase-messaging-sw.js` service worker served from the
// site root. When either is absent we skip silently so the rest of the app —
// including the polled unread badge — keeps working.
const VAPID_KEY = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Registers the browser's FCM token with the backend once notifications are
 * allowed. Never asks: it runs on every page load, and a prompt nobody asked
 * for on load is what browsers quieten and users block. Fully defensive: any missing capability (unsupported browser,
 * missing VAPID key, denied permission, missing service worker) results in a
 * logged skip rather than a thrown error.
 */
export const registerPushToken = async (register: RegisterTokenFn): Promise<void> => {
  try {
    if (typeof window === 'undefined' || !(WEB_NOTIFICATION_API in window)) return;
    if (VAPID_KEY === undefined) {
      if (__DEV__) {
        console.warn(`${LogTag.pushTokenRegistrar} ${LogMessage.vapidKeyMissing}`);
      }
      return;
    }
    if (!(await isSupported())) return;

    const app = getFirebaseApp();
    if (app === null) return;

    if (Notification.permission !== 'granted') return;

    // Deprecated signature kept: Expo web does not register the messaging service worker.
    const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY });
    if (token.length === ValueConstants.zero) return;

    const result = await register(token, DevicePlatform.Web);
    if (!result.ok && __DEV__) {
      console.warn('[push-token-registrar] backend rejected device token:', result.failure.code);
    }
  } catch (err) {
    if (__DEV__) console.warn('[push-token-registrar] web push registration skipped:', err);
  }
};
