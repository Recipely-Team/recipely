import type { AnalyticsServiceInterface } from '@domain/analytics/analytics-service-interface';

// WHY: a top-level static import of @react-native-firebase/analytics causes the
// native RNFBAppModule to be initialised at module-load time. On Expo Go (or any
// build that lacks the Firebase native layer) this throws before any try/catch
// can intervene, crashing the app on startup. Wrapping require() in an IIFE
// catches that throw once — all methods then no-op when the module is
// unavailable, while Jest's jest.mock() hoisting keeps unit-tests working.
// The web half of this pair (`analytics-service.web.ts`) speaks to the Firebase
// JS SDK instead; nothing here asks `Platform.OS`, because the bundler already
// answered that question by picking a file (rule 13).
type AnalyticsModule = typeof import('@react-native-firebase/analytics');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod: AnalyticsModule | null = (() => { try { return require('@react-native-firebase/analytics') as AnalyticsModule; } catch { return null; } })();

export const analyticsService: AnalyticsServiceInterface = {
  async setEnabled(enabled: boolean): Promise<void> {
    if (mod === null) return;
    try {
      await mod.setAnalyticsCollectionEnabled(mod.getAnalytics(), enabled);
    } catch {
      // Firebase native module unavailable — no-op.
    }
  },

  async logEvent(
    name: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<void> {
    if (mod === null) return;
    try {
      await mod.logEvent(mod.getAnalytics(), name, params);
    } catch {
      // no-op
    }
  },

  async logScreen(screenName: string, screenClass?: string): Promise<void> {
    if (mod === null) return;
    try {
      await mod.logScreenView(mod.getAnalytics(), {
        screen_name: screenName,
        screen_class: screenClass ?? screenName,
      });
    } catch {
      // no-op
    }
  },
};
