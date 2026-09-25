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
  /**
   * Absent on recipes the backend has no timing for (AI-generated and imported
   * ones, mostly). It was declared required, nothing checked it, and every type
   * downstream said `number` while the value was `undefined` — which reached
   * the screen as "undefined min".
   */
  readonly totalTimeMinutes?: number;
  readonly rating: number;
  /** Absent from a server that predates private saves. */
  readonly isPublished?: boolean;
  readonly moderationStatus: string;
  readonly likeCount: number;
  readonly likedByMe: boolean;
  readonly commentCount: number;
  readonly viewCount: number;
  /** Where the text came from: `USER`, `AI` or `IMPORT`. */
  origin?: string;
  /** Which platform an import came from: `INSTAGRAM` or `TIKTOK`. */
  sourcePlatform?: string | null;
  /** Whether a model produced the text — true for a generation AND an import. */
  aiWritten?: boolean;
}
