import type { FirebaseApp } from 'firebase/app';
import { analyticsService } from '@infrastructure/firebase/analytics-service';
import { setCrashReportingEnabled } from '@infrastructure/firebase/crashlytics-service';

/**
 * Native counterpart of the web `getFirebaseApp`. On native, Firebase is
 * provided by `@react-native-firebase/*` (auto-initialized from the native
 * config files) — there is no JS SDK `FirebaseApp` instance — so this always
 * returns `null`. It exists only to keep the platform-extension signatures in
 * sync so the web social-auth provider type-checks against the `.ts` variant.
 */
export const getFirebaseApp = (): FirebaseApp | null => null;

/**
 * Initializes Firebase data collection. Firebase itself auto-initializes from
 * `google-services.json` / `GoogleService-Info.plist` at app launch — this only
 * toggles Analytics and Crashlytics collection off in development so dev
 * activity doesn't pollute production metrics.
 */
export const initFirebase = async (): Promise<void> => {
  const collect = !__DEV__;
  await Promise.allSettled([
    analyticsService.setEnabled(collect),
    setCrashReportingEnabled(collect),
  ]);
};
