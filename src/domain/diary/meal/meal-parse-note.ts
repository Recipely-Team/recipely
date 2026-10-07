/** The meal parser's remark on the whole answer, when it has one. Also the wire values. */
export const MealParseNote = {
  NothingDetected: 'nothing_detected',
  SomeEstimated: 'some_estimated',
} as const;

export type MealParseNoteType = (typeof MealParseNote)[keyof typeof MealParseNote];
