/** How a meal is described to the parser: in words, or by a photo. */
export const MealParseInputKind = {
  Text: 'text',
  Photo: 'photo',
} as const;

export type MealParseInputKindType = (typeof MealParseInputKind)[keyof typeof MealParseInputKind];
