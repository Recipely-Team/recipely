import { readDeviceProfile } from '@infrastructure/device/device-profile';
import { setCrashAttributes } from '@infrastructure/firebase/crashlytics-service';
import { logAnalyticsEvent } from '@infrastructure/firebase/analytics-service';
import { AnalyticsEvent } from '@infrastructure/constants/analytics';

/**
 * Records what this launch is running on, once, while the splash is still up.
 *
 * @remarks
 * - **Two sinks, two questions.** The Crashlytics keys answer "what was this
 *   crash running on" and are attached to every report the session files; the
 *   analytics event answers "what is the fleet running" across launches. A
 *   crash report that named neither the model nor the build left both
 *   unanswerable, and the OS version is the first thing anyone asks about a
 *   report they cannot reproduce.
 * - **At launch, not at the crash.** Crashlytics flushes what it holds when
 *   the process dies; anything gathered inside a crash handler is gathered too
 *   late, and a process killed by the OS never runs one at all.
 * - **It cannot fail loudly.** Both sinks swallow their own errors, and the
 *   read is wrapped even though it is written not to throw — this runs inside
 *   the launch effect, ahead of the auth hydrate, the notification service and
 *   the onboarding read, and a diagnostic must never be the reason those never
 *   ran. Every other statement in that effect is guarded; so is this one.
 */
export const reportDeviceProfile = (): void => {
  try {
    const profile = readDeviceProfile();

    setCrashAttributes({ ...profile });
    void logAnalyticsEvent(AnalyticsEvent.deviceProfile, { ...profile });

    // Local visibility only — the production channels are the two above, and an
    // unguarded console line raises a LogBox over the app in a dev build (rule 22).
    if (__DEV__) console.log('[device]', profile);
  } catch {
    // Nothing to report the failure to report with.
  }
};
