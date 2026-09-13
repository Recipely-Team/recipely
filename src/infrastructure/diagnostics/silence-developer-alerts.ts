import { recordCrash } from '@infrastructure/firebase/crashlytics-service';

/** Enough of the message to recognise it in a report; not enough to be a payload. */
const REPORTED_LENGTH = 300;
const ORIGIN = 'silenceDeveloperAlerts';

/**
 * Stops a library's developer dialog from reaching the person using the app.
 *
 * @remarks
 * - **The incident.** `expo-router/head` on iOS registers a Handoff activity,
 *   and with no `origin` in the Expo config its own `throwOrAlert` calls
 *   `alert()` — deliberately, because it "prefers a dialog to a crash" in a
 *   RELEASE build. The App Store build opened *Expo Head: Add the handoff
 *   origin to the Expo Config* over onboarding, again over login, and again on
 *   every screen after that. A stack of English developer instructions, on a
 *   Turkish app, in the hands of someone who had just installed it.
 * - **Why a net and not only the fix.** That one import is now web-only and a
 *   structure rule keeps it there. But `alert()` is a global any dependency can
 *   reach, and the next one will arrive the same way: through a package we
 *   updated, in a build we shipped, saying something only we can act on. The
 *   rule this encodes is that **a message the user cannot act on is not a
 *   message to the user** — it is a bug report, and it goes where bug reports
 *   go.
 * - **Release only.** In development the dialog is exactly what a developer
 *   wants, and it is the reason this was found at all.
 * - **The app's own dialogs are unaffected.** Everything a user is meant to
 *   read goes through `Alert.alert` with copy from `t()`, or through the shared
 *   sheets — never through the global `alert`.
 */
export const silenceDeveloperAlerts = (): void => {
  if (__DEV__) return;

  const scope = globalThis as { alert?: (message?: unknown) => void };
  if (typeof scope.alert !== 'function') return;

  scope.alert = (message?: unknown): void => {
    recordCrash(new Error(`alert() reached a release build: ${String(message).slice(0, REPORTED_LENGTH)}`), ORIGIN);
  };
};
