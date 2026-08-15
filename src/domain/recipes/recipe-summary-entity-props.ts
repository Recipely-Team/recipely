import type { Difficulty } from '@domain/recipes/difficulty';

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
}
