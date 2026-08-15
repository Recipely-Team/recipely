/**
 * How a single refined field differs, which decides how the proposal card
 * renders it: a value reads as "before → after", a list as the lines added and
 * dropped. Nothing else about a field matters to the diff.
 */
export const RecipeChangeKind = {
  Value: 'value',
  List: 'list',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type RecipeChangeKind = (typeof RecipeChangeKind)[keyof typeof RecipeChangeKind];
