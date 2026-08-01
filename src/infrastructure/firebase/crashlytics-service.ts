import { isWeb } from '@infrastructure/constants/platform';

// WHY: same lazy-require pattern as analytics-service — see that file for rationale.
type CrashlyticsModule = typeof import('@react-native-firebase/crashlytics');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod: CrashlyticsModule | null = (() => { try { return require('@react-native-firebase/crashlytics') as CrashlyticsModule; } catch { return null; } })();

/** Enables or disables crash reporting collection (kept off in development). */
export const setCrashReportingEnabled = async (enabled: boolean): Promise<void> => {
  if (isWeb() || mod === null) return;
  try {
    await mod.setCrashlyticsCollectionEnabled(mod.getCrashlytics(), enabled);
  } catch {
    // Firebase native module unavailable — no-op.
  }
};

/** Records a non-fatal error to Crashlytics, optionally preceded by a context breadcrumb. */
export const recordCrash = (error: unknown, context?: string): void => {
if (isWeb() || mod === null) return;
  try {
    const crashlytics = mod.getCrashlytics();
    if (context !== undefined) mod.log(crashlytics, context);
    mod.recordError(crashlytics, error instanceof Error ? error : new Error(String(error)));
  } catch {
    // no-op
  }
};

/** Adds a breadcrumb attached to the next crash report. */
export const logCrashBreadcrumb = (message: string): void => {
  if (isWeb() || mod === null) return;
  try {
    mod.log(mod.getCrashlytics(), message);
  } catch {
    // no-op
  }
};
