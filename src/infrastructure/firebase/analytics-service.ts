import { Platform } from 'react-native';

// WHY: a top-level static import of @react-native-firebase/analytics causes the
// native RNFBAppModule to be initialised at module-load time. On Expo Go (or any
// build that lacks the Firebase native layer) this throws before any try/catch
// can intervene, crashing the app on startup. Wrapping require() in an IIFE
// catches that throw once — all exported functions then no-op when the module is
// unavailable, while Jest's jest.mock() hoisting keeps unit-tests working.
type AnalyticsModule = typeof import('@react-native-firebase/analytics');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod: AnalyticsModule | null = (() => { try { return require('@react-native-firebase/analytics') as AnalyticsModule; } catch { return null; } })();

/** Enables or disables analytics collection (kept off in development). */
export const setAnalyticsEnabled = async (enabled: boolean): Promise<void> => {
  if (Platform.OS === 'web' || mod === null) return; // TO DO: static platform check problem
  try {
    await mod.setAnalyticsCollectionEnabled(mod.getAnalytics(), enabled);
  } catch {
    // Firebase native module unavailable — no-op.
  }
};

/** Logs a custom analytics event. */
export const logAnalyticsEvent = async (
  name: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> => {
  if (Platform.OS === 'web' || mod === null) return; // TO DO: static platform check problem
  try {
    await mod.logEvent(mod.getAnalytics(), name, params);
  } catch {
    // no-op
  }
};

/** Logs a screen view for screen-flow analytics. */
export const logScreen = async (screenName: string, screenClass?: string): Promise<void> => {
  if (Platform.OS === 'web' || mod === null) return; // TO DO: static platform check problem
  try {
    await mod.logScreenView(mod.getAnalytics(), {
      screen_name: screenName,
      screen_class: screenClass ?? screenName,
    });
  } catch {
    // no-op
  }
};
