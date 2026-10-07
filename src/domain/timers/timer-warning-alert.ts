/** A {@link TimerWarning} with its words, ready for the notification port. */
export interface TimerWarningAlert {
  /** Epoch ms the notification fires at. */
  fireAtMs: number;
  /** What it says, e.g. "5 minutes left". */
  body: string;
}
