/**
 * The Month view's three tiles (design spec §5). Only logged days before
 * today count toward `dailyAverage` and `daysOnTarget` / `daysLogged` —
 * today is not over yet.
 */
export interface DiaryMonthStats {
  /** Mean kcal of the logged days before today; null when there are none (the tile shows "—"). */
  readonly dailyAverage: number | null;
  readonly daysOnTarget: number;
  readonly daysLogged: number;
  /** Consecutive logged days ending today, or yesterday when today is still empty. */
  readonly streak: number;
}
