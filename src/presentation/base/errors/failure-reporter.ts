import { FailureCode } from '@core/failure';
import type { Failure } from '@presentation/base/types';

/** Failure sink, filled by the composition root. */
type Sink = (error: unknown, context: string) => void;

/**
 * Codes worth reporting.
 *
 * @remarks
 * Everything else is a failure the app already ANSWERED: a validation message
 * against the offending field, a login prompt, a "not found" screen. Reporting
 * those would bury the ones nobody predicted under thousands the product
 * handles by design — and a crash report nobody reads is the same as none.
 *
 * `network` and `timeout` are deliberately absent for the same reason: a user
 * on a train produces them by the dozen and there is nothing to fix.
 */
const REPORTED_CODES: ReadonlySet<string> = new Set([FailureCode.Unknown, FailureCode.Server]);

/** Stands in for anything that looked like it identified a person or a place. */
const REDACTED = '[redacted]';

/**
 * Local on purpose, not `RegexConstants`.
 *
 * Those are anchored (`^https?://`, `^…@…$`) because they answer "is this whole
 * string a URL / an email". Redaction asks a different question — "is there one
 * ANYWHERE in this sentence" — so it needs unanchored, global patterns, and
 * only this file needs them.
 */
const URL_ANYWHERE = /https?:\/\/\S+/g;
const EMAIL_ANYWHERE = /[^\s@]+@[^\s@]+\.[^\s@]+/g;

/**
 * Strips the parts of a developer message that may carry user data.
 *
 * `Failure.message` is written for developers, but some are built by
 * interpolating the value that failed — a URL, an id. Those must not leave the
 * device: rule 22 exists because user ids and recipe ids had already leaked
 * into logs once.
 */
const redact = (message: string): string =>
  message
    .replace(URL_ANYWHERE, REDACTED)
    .replace(EMAIL_ANYWHERE, REDACTED);

/**
 * Sends unexpected failures to crash reporting, and drops the rest.
 *
 * @remarks
 * - **Why this exists.** Two bugs shipped and were chased blind, because every
 *   unexpected failure reaches the user as one sentence — "Bir şeyler ters
 *   gitti" — and reaches us as nothing at all. The real reason was sitting in
 *   `Failure.message` the whole time, on the device, unread.
 * - **Why a sink rather than an import.** Presentation may not reach into
 *   infrastructure (rule 17), so it declares the hole and the composition root
 *   fills it with `recordCrash`. Unset — in tests, or before bootstrap — this
 *   is silently a no-op, which is the right behaviour for something that must
 *   never be the reason a screen fails.
 */
export const FailureReporter = {
  setSink(sink: Sink | null): void {
    current = sink;
  },

  report(failure: Failure, context: string): void {
    if (current === null || !REPORTED_CODES.has(failure.code)) return;
    try {
      current(new Error(`${failure.code}: ${redact(failure.message)}`), context);
    } catch {
      // Reporting a failure must never itself surface one.
    }
  },
};

let current: Sink | null = null;
