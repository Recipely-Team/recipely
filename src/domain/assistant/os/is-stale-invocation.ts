import { TimeConstants } from '@core/constants';
import type { OsIntentInvocation } from '@domain/assistant/os/os-intent-invocation';

const FRESH_FOR_MINUTES = 2;

/** How long a queued request is still the thing the user just asked for. */
const FRESH_FOR_MS =
  FRESH_FOR_MINUTES * TimeConstants.secondsPerMinute * TimeConstants.millisecondsPerSecond;

/**
 * Whether a queued OS request is too old to run.
 *
 * @remarks
 * - **The queue is a to-do list for the next launch, not a history.** Every
 *   legitimate request is read within seconds: an intent that opens the app
 *   launches it at once, and "Ask Recipely" queues just before it asks to
 *   continue in the app.
 * - **What is left behind is what nobody is waiting for.** Measured on the
 *   simulator: answering Siri's "continue in the app" with Cancel does not reach
 *   the intent's catch, and a process killed while the prompt is up never
 *   resumes — so neither withdraws its request. Run on the next launch, hours
 *   later, a search or a navigation arrives that the user cannot connect with
 *   anything they did. Two minutes is long past a cold start and short of that.
 * - **Time at Siri's prompt counts.** `at` is stamped when the request is queued,
 *   just before "continue in the app" appears, so a prompt left open past two
 *   minutes and then accepted opens the app with nothing to run. Accepted as the
 *   price of never running a request the user walked away from.
 */
export function isStaleInvocation(invocation: OsIntentInvocation, now: number): boolean {
  return now - invocation.at > FRESH_FOR_MS;
}
