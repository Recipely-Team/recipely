/**
 * The server's answer to a heartbeat.
 *
 * `isUnlimited` is carried alongside the number rather than encoded into it
 * (a negative, a sentinel, `Infinity`) because the only thing the client does
 * with the number is compare it to zero — and an unmetered account has to be
 * told apart from a generous one, not merely given a bigger allowance.
 */
export interface AssistantUsageReportType {
  readonly remainingSeconds: number;
  readonly isUnlimited: boolean;
}
