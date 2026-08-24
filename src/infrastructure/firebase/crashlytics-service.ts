import { isWeb } from '@infrastructure/constants/platform';
import { CrashSentinel } from '@infrastructure/firebase/crash-sentinel';

// WHY: same lazy-require pattern as analytics-service — see that file for rationale.
type CrashlyticsModule = typeof import('@react-native-firebase/crashlytics');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod: CrashlyticsModule | null = (() => { try { return require('@react-native-firebase/crashlytics') as CrashlyticsModule; } catch { return null; } })();

/**
 * Forces the Crashlytics module to be constructed, which is the only thing
 * that installs its JS-side catch-alls.
 *
 * @remarks
 * `@react-native-firebase/crashlytics` sets the global `ErrorUtils` handler and
 * enables unhandled-promise-rejection tracking inside its module constructor —
 * see `lib/namespaced.ts`. Nothing installs them at import time, so until
 * something touches `getCrashlytics()` an uncaught JS error goes to the default
 * handler and is never reported. This used to happen inside `AppBootstrap`'s
 * effect; the entry point calls it now, so a throw during launch is covered
 * too. The instance is deliberately discarded: the side effect is the point.
 */
export const warmUpCrashReporting = (): void => {
  if (isWeb() || mod === null) return;
  try {
    mod.getCrashlytics();
  } catch {
    // Native module unavailable — nothing to install.
  }
};

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

/**
 * Attaches facts that every later crash report carries.
 *
 * Custom keys rather than a log line: a breadcrumb is only readable inside the
 * report it was written into, while a key is a column — "which OS version" and
 * "only on that one model" are questions asked of the WHOLE crash list, and
 * they could not be asked at all when the report said nothing about the
 * device.
 */
export const setCrashAttributes = (attributes: Record<string, string>): void => {
  if (isWeb() || mod === null) return;
  try {
    void mod.setAttributes(mod.getCrashlytics(), attributes);
  } catch {
    // no-op
  }
};

/**
 * Adds a breadcrumb attached to the next crash report.
 *
 * @remarks
 * It is also handed to {@link CrashSentinel}, so the step survives a death that
 * files no report at all — a killed process cannot flush a Crashlytics log, but
 * the marker it left on disk is read by the next launch. Every breadcrumb is by
 * definition "where the app is", which is exactly what the sentinel needs, so
 * the two are wired together here rather than at every call site.
 */
export const logCrashBreadcrumb = (message: string): void => {
  if (isWeb()) return;
  void CrashSentinel.noteStep(message);
  if (mod === null) return;
  try {
    mod.log(mod.getCrashlytics(), message);
  } catch {
    // no-op
  }
};
