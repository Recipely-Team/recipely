/** Why the last session ended, so a UI can say so rather than just go quiet. */
export const EndReason = {
  /** `stop()` was called. */
  Stopped: 'stopped',
  /** Nothing was heard or said for `silenceTimeoutMs`. */
  Silence: 'silence',
  /** It could not start, or dropped and could not be continued; see `error`. */
  Failed: 'failed',
} as const;

export type EndReasonType = (typeof EndReason)[keyof typeof EndReason];
