import {
  type Analytics,
  getAnalytics,
  isSupported,
  logEvent,
  setAnalyticsCollectionEnabled,
} from 'firebase/analytics';
import type { AnalyticsServiceInterface } from '@domain/analytics/analytics-service-interface';
import { getFirebaseApp } from '@infrastructure/firebase/firebase-init';

/**
 * Firebase's own spelling of the screen-view parameters.
 *
 * Deliberately not in the `AnalyticsEvent` catalogue next door: that names the
 * events THIS app invents, whereas `screen_view` is Firebase's reserved event
 * and these two parameter keys travel with it. GA4 takes `screen_name` /
 * `screen_class` from the native SDKs and `firebase_screen` /
 * `firebase_screen_class` from the JS one — the same two columns in the
 * console, spelled differently on the wire, and getting them wrong shows
 * `(not set)` with no error anywhere.
 */
const SCREEN_VIEW_EVENT = 'screen_view';
const SCREEN_PARAM = 'firebase_screen';
const SCREEN_CLASS_PARAM = 'firebase_screen_class';

let instance: Analytics | null = null;
let collecting = false;

/**
 * The web Analytics handle, or `null` when there is nothing to log to.
 *
 * @remarks
 * - **Collection is a gate, not a switch here.** `getAnalytics` is what boots
 *   gtag, and gtag reports a `page_view` of its own the moment it does — so
 *   disabling collection afterwards is too late. Nothing is instantiated until
 *   `setEnabled(true)` has said it may be, which is what keeps a `npm run web`
 *   development session out of the live property.
 * - **`null` is the normal answer in three cases**, all fine: the
 *   `EXPO_PUBLIC_FIREBASE_*` config was not injected at build time, the browser
 *   does not support Analytics (some embedded webviews), or this is the static
 *   export running under Node, where `getAnalytics` throws on a missing
 *   `window`. Both the support probe and its answer are cached — a browser that
 *   says no should not be asked again on every navigation.
 */
const resolveAnalytics = async (): Promise<Analytics | null> => {
  if (!collecting) return null;
  if (instance !== null) return instance;
  const app = getFirebaseApp();
  if (app === null) return null;
  try {
    if (!(await isSupported())) {
      collecting = false;
      return null;
    }
    instance = getAnalytics(app);
    return instance;
  } catch {
    collecting = false;
    return null;
  }
};

export const analyticsService: AnalyticsServiceInterface = {
  async setEnabled(enabled: boolean): Promise<void> {
    collecting = enabled;
    if (!enabled) {
      // Only reachable once something already booted gtag; the flag above is
      // what prevents that in the first place.
      if (instance !== null) setAnalyticsCollectionEnabled(instance, false);
      return;
    }
    const analytics = await resolveAnalytics();
    if (analytics === null) return;
    try {
      setAnalyticsCollectionEnabled(analytics, true);
    } catch {
      // no-op
    }
  },

  async logEvent(
    name: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<void> {
    const analytics = await resolveAnalytics();
    if (analytics === null) return;
    try {
      logEvent(analytics, name, params);
    } catch {
      // no-op
    }
  },

  /**
   * The web build is a single HTML document whose `<title>` is the same on
   * every route, so the automatic `page_view` cannot tell one screen from
   * another. This is what puts the router's own screen names in the console.
   */
  async logScreen(screenName: string, screenClass?: string): Promise<void> {
    const analytics = await resolveAnalytics();
    if (analytics === null) return;
    try {
      logEvent(analytics, SCREEN_VIEW_EVENT, {
        [SCREEN_PARAM]: screenName,
        [SCREEN_CLASS_PARAM]: screenClass ?? screenName,
      });
    } catch {
      // no-op
    }
  },
};
