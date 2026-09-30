/** The shape drawn with a status so it is never told by colour alone (design spec → Food Diary §2.1). */
export const StatusMarkerKind = {
  /** Under goal. */
  HollowCircle: 'hollowCircle',
  /** On target. */
  Check: 'check',
  /** Over goal. */
  Triangle: 'triangle',
  /** Far over goal. */
  DoubleChevron: 'doubleChevron',
} as const;

export type StatusMarkerKindType = (typeof StatusMarkerKind)[keyof typeof StatusMarkerKind];
