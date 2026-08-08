import { FailureCode } from '@core/failure';
import type { Failure } from '@presentation/base/types';

/** Crash sink, filled by the composition root. */
type Sink = (error: unknown, context: string) => void;
/** Counting sink for every failure, crash-worthy or not. */
type EventSink = (code: string, context: string) => void;

/**
 * Codes worth a CRASH REPORT.
 *
 * @remarks
 * Everything else is a failure the app already ANSWERED: a validation message
 * against the offending field, a login prompt, a "not found" screen. Reporting
 * those would bury the ones nobody predicted under thousands the product
 * handles by design — and a crash report nobody reads is the same as none.
 *
 * `network` and `timeout` are deliberately absent for the same reason: a user
 * on a train produces them by the dozen and there is nothing to fix.
 *
 * They are not lost, though: EVERY failure that reaches a user is counted as an
 * analytics event. Crashlytics answers "what broke that we did not foresee",
 * analytics answers "how often does this happen, and to whom" — and a spike in
 * handled `network` failures is a real signal that belongs on the second one.
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

  setEventSink(sink: EventSink | null): void {
    events = sink;
  },

  /**
   * Called wherever a failure becomes something the user can see.
   *
   * Every failure is counted; only the unforeseen ones are also reported as
   * crashes. Both sinks are wrapped: reporting a failure must never itself
   * surface one.
   */
  report(failure: Failure, context: string): void {
    try {
      events?.(failure.code, context);
    } catch {
      // no-op
    }
    if (current === null || !REPORTED_CODES.has(failure.code)) return;
    try {
      current(new Error(`${failure.code}: ${redact(failure.message)}`), context);
    } catch {
      // no-op
    }
  },
};

let current: Sink | null = null;
let events: EventSink | null = null;
