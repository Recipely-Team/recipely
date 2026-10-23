/**
 * The separate things the diary store loads, each with its own `DiaryLoadState`,
 * so a failed month load does not blank the day.
 *
 * @remarks
 * - **Writes are not a concern.** Add, update, delete, water and goals each
 *   return their own `Result` to the caller that made them; a shared "save
 *   error" was written by every write and read by nothing.
 */
export const DiaryConcern = {
  Day: 'day',
  Month: 'month',
  Recent: 'recent',
  Goals: 'goals',
} as const;

export type DiaryConcernType = (typeof DiaryConcern)[keyof typeof DiaryConcern];
