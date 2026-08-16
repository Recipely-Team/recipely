import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { FeedRowKind } from '@presentation/app/recipes/model/ads/feed-row-kind';

/**
 * One row of the recipe feed.
 *
 * @remarks
 * **The ad row carries its own key.** `FlatList` needs a stable key per row and
 * a recipe's is its id; an ad has no id, and using the array index would hand
 * every ad below an inserted recipe a different key on the next page — which
 * remounts the banner and re-requests the ad. The ordinal is stable because ads
 * are only ever appended after the recipes already on screen.
 */
export type FeedRow =
  | { readonly kind: typeof FeedRowKind.Recipe; readonly recipe: RecipeSummaryEntity }
  | { readonly kind: typeof FeedRowKind.Ad; readonly ordinal: number };
