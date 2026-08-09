import { isWeb } from '@infrastructure/constants/platform';
import { kvStore } from '@infrastructure/storage/kv-store';
import { CRASH_SENTINEL_STORAGE_KEY } from '@infrastructure/constants/storage';

/**
 * Catches the deaths no error handler can.
 *
 * @remarks
 * - **Why a handler is not enough.** `ErrorUtils`, promise-rejection tracking
 *   and the native Crashlytics signal handlers all work by RUNNING CODE inside
 *   the dying process. An OOM kill, an ANR the system resolves by killing, a
 *   `SIGKILL`, a watchdog termination — none of them run anything. The process
 *   is simply gone and Crashlytics receives exactly nothing. That is the shape
 *   of the open Android bug: the app disappears and no report arrives.
 * - **How this catches it.** A foreground session writes a marker; going to the
 *   background erases it. A marker still present at the NEXT launch therefore
 *   means the last session was in the foreground one moment and gone the next,
 *   without ever being backgrounded — a death, not a user leaving.
 * - **It carries the last breadcrumb, not data.** The stored value is the most
 *   recent breadcrumb message, so the report names the step the app was on when
 *   it vanished. Breadcrumbs are places in the code and never carry ids or URLs
 *   (CLAUDE.md rule 22), which is what makes one safe to persist and send.
 * - **`inactive` is not `background`.** iOS passes through `inactive` for a
 *   control-centre swipe or an incoming call. Disarming there would erase the
 *   marker for a session that is still very much alive, so only a real
 *   `background` counts as a clean exit.
 * - **Nothing here reports.** Detecting a silent death and reporting one stay
 *   separate: this module never imports Crashlytics, so the detection is
 *   testable on its own and the caller owns what a death is worth saying.
 */
export const CrashSentinel = {
  /**
   * Reads the previous session's marker and clears it.
   *
   * Resolves to the breadcrumb it was holding when it died, or `null` when the
   * last session exited cleanly — or when there was no last session at all.
   */
  async consumePreviousSession(): Promise<string | null> {
    if (isWeb()) return null;
    const stored = await kvStore.getItem(CRASH_SENTINEL_STORAGE_KEY);
    if (!stored.ok || stored.value === null) return null;
    await kvStore.removeItem(CRASH_SENTINEL_STORAGE_KEY);
    return stored.value;
  },

  /**
   * Starts watching a foreground session.
   *
   * Re-arming after a return from the background resumes at the step the app
   * had reached, not at the launch step: a session that comes back and dies is
   * a death at wherever it actually was.
   */
  async arm(): Promise<void> {
    if (isWeb()) return;
    armed = true;
    await kvStore.setItem(CRASH_SENTINEL_STORAGE_KEY, lastStep);
  },

  /**
   * Moves the watched session forward. A no-op while disarmed, so a breadcrumb
   * logged by a backgrounded session cannot re-arm one that already said
   * goodbye — but the step is still remembered, ready for the next `arm`.
   */
  async noteStep(step: string): Promise<void> {
    lastStep = step;
    if (isWeb() || !armed) return;
    await kvStore.setItem(CRASH_SENTINEL_STORAGE_KEY, step);
  },

  /** The user left on purpose: this session owes no explanation. */
  async disarm(): Promise<void> {
    if (isWeb()) return;
    armed = false;
    await kvStore.removeItem(CRASH_SENTINEL_STORAGE_KEY);
  },
};

let armed = false;
/** The step a session is on before it has reached anything of its own. */
let lastStep = 'app: launched';
