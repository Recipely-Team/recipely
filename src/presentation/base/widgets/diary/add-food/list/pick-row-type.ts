/** What a row of the pick step's list draws. */
export const PickRowType = {
  Heading: 'heading',
  Recipe: 'recipe',
  Product: 'product',
  Recent: 'recent',
  /** A list's next page loading, or its retry after a failure. */
  More: 'more',
} as const;

export type PickRowTypeType = (typeof PickRowType)[keyof typeof PickRowType];
