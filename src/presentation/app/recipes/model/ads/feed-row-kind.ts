/**
 * What a row in the recipe feed is. The feed used to be a list of recipes, so
 * every row could be assumed to have an id and a photo; once an ad can sit
 * between them, the list is a list of two things and the renderer has to ask.
 */
export const FeedRowKind = {
  Recipe: 'recipe',
  Ad: 'ad',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type FeedRowKind = (typeof FeedRowKind)[keyof typeof FeedRowKind];
