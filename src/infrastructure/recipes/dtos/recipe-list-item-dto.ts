import type { Difficulty } from '@domain/recipes/difficulty';

// Lean wire shape returned by the Recipely backend for list/my-recipes/trending
// endpoints. Keep in sync with recipely-backend
// `application/recipes/dtos/recipe-list-item.dto.ts` (commit 3c9106b).
// The single recipe detail endpoint still returns the full `RecipeDto`.
export interface RecipeListItemDto {
  readonly id: string;
  readonly name: string;
  readonly image: string;
  readonly cuisine: string;
  readonly category: string;
  readonly difficulty: Difficulty;
  readonly totalTimeMinutes: number;
  readonly rating: number;
  readonly moderationStatus: string;
  readonly likeCount: number;
  readonly likedByMe: boolean;
  readonly commentCount: number;
  readonly viewCount: number;
}
