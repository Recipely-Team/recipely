/** Sort options offered in the recipe list UI. */
export const SortKey = {
  Popular: 'popular',
  Rating: 'rating',
  Time: 'time',
  Newest: 'newest',
  MostLiked: 'mostLiked',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type SortKey = (typeof SortKey)[keyof typeof SortKey];
