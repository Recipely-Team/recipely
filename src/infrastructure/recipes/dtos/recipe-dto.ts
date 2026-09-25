import type { Difficulty } from '@domain/recipes/difficulty';
import type { MediaDto } from '@infrastructure/recipes/media/media-dto';
import type { NutritionDto } from '@infrastructure/recipes/dtos/nutrition-dto';

// Wire shape returned by the Recipely backend for a single recipe.
// Keep in sync with recipely-backend `application/recipes/dtos/recipe.dto.ts`.
export interface RecipeDto {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  difficulty: Difficulty;
  ingredients: string[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  caloriesPerServing: number;
  nutrition?: NutritionDto;
  image: string;
  rating: number;
  tags: string[];
  mealType: string[];
  ownerId: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  media?: MediaDto[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  /** Where the text came from: `USER`, `AI` or `IMPORT`. */
  origin?: string;
  /** The post an import came from. */
  sourceUrl?: string;
  /** The account that posted it, without the '@'. */
  sourceHandle?: string;
  /** Which platform an import came from: `INSTAGRAM` or `TIKTOK`. */
  sourcePlatform?: string | null;
  /** Whether a model produced the text — true for a generation AND an import. */
  aiWritten?: boolean;
  /** Absent from a server that predates private saves. */
  isPublished?: boolean;
  moderationStatus: string;
  /** Owner only: what a website import still needs before it can be published. */
  publishBlockers?: string[];
}
