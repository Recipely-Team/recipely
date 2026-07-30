import type { RegisterTokenFn } from '@infrastructure/notifications/register-token-fn';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getFirebaseApp } from '@infrastructure/firebase/firebase-init.web';
import { ValueConstants } from '@core/constants';

// Web push needs a VAPID key (Firebase Console → Cloud Messaging → Web Push
// certificates) and a `firebase-messaging-sw.js` service worker served from the
// site root. When either is absent we skip silently so the rest of the app —
// including the polled unread badge — keeps working.
const VAPID_KEY = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Requests notification permission and registers the browser's FCM token with
 * the backend. Fully defensive: any missing capability (unsupported browser,
 * missing VAPID key, denied permission, missing service worker) results in a
 * logged skip rather than a thrown error.
 */
export const registerPushToken = async (register: RegisterTokenFn): Promise<void> => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (VAPID_KEY === undefined) {
      if (__DEV__) {
        console.warn('[push-token-registrar] EXPO_PUBLIC_FIREBASE_VAPID_KEY missing — skipping web push registration');
      }
      return;
    }
    if (!(await isSupported())) return;

    const app = getFirebaseApp();
    if (app === null) return;

    const permission =
      Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
    if (permission !== 'granted') return;

    const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY });
    if (token.length === ValueConstants.zero) return;

    const result = await register(token, 'web');
    if (!result.ok && __DEV__) {
      console.warn('[push-token-registrar] backend rejected device token:', result.failure.code);
    }
  } catch (err) {
    if (__DEV__) console.warn('[push-token-registrar] web push registration skipped:', err);
  }
};
