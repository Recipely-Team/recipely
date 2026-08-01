/**
 * The orderings the recipe feed offers. The value is what the backend's `sort`
 * query parameter expects, so these strings travel on the wire as well as
 * driving the sort sheet.
 */
export const RecipeSort = {
  Popular: 'popular',
  Rating: 'rating',
  Time: 'time',
  Newest: 'newest',
  MostLiked: 'mostLiked',
  Alphabetical: 'alphabetical',
  MostCommented: 'mostCommented',
} as const;

export type RecipeSortType = (typeof RecipeSort)[keyof typeof RecipeSort];
