/** One "time is almost up" heads-up for a running timer. */
export interface TimerWarning {
  /** Epoch ms the heads-up fires at. */
  fireAtMs: number;
  /** Whole minutes left on the timer when it fires. */
  minutesLeft: number;
}
