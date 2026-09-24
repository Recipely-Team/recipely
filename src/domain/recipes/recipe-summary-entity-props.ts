import type { Difficulty } from '@domain/recipes/difficulty';
import type { RecipeOriginType } from '@domain/recipes/recipe-origin';

export interface RecipeSummaryEntityProps {
  id: string;
  name: string;
  image: string;
  // Opaque taxonomy keys — see `RecipeEntityProps.cuisine` in `recipe.ts` for why
  // these stay `string` rather than the local curated enums.
  cuisine: string;
  category: string;
  difficulty: Difficulty;
  /** `null` when the source has no timing — the UI hides the chip rather than inventing one. */
  totalTimeMinutes: number | null;
  rating: number;
  moderationStatus: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  viewCount: number;
  /**
   * Where the text came from.
   *
   * No `sourceUrl` / `sourceHandle` beside it: the list endpoint does not send
   * them, and the compact badge on a card never says more than which of the
   * three it is. A summary that carried fields the wire never fills would be a
   * promise the feed cannot keep.
   */
  origin: RecipeOriginType;
}
