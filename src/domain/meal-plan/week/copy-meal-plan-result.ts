/** What copying last week did: meals planned, and meals left out (a past day, or a day already full). */
export interface CopyMealPlanResult {
  readonly copied: number;
  readonly skipped: number;
}
