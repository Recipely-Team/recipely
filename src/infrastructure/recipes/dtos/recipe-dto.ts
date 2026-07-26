import type { Difficulty } from '@domain/recipes/difficulty';
import type { MediaDto } from '@infrastructure/recipes/media/media-dto';

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
  nutrition?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
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
  moderationStatus: string;
}
