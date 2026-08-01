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
  totalTimeMinutes: number;
  rating: number;
  moderationStatus: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  viewCount: number;
}
