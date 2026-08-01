import type { MediaItem } from '@domain/recipes/media/media-item';
import type { Difficulty } from '@domain/recipes/difficulty';
import type { RecipeNutrition } from '@domain/recipes/recipe-nutrition';

export interface RecipeEntityProps {
  id: string;
  name: string;
  // Opaque taxonomy keys; the backend owns the full catalog and validates
  // them. Kept as `string` rather than the local enums (which mirror only a
  // curated subset) so recipes using newer backend keys round-trip intact.
  cuisine: string;
  category: string;
  difficulty: Difficulty;
  ingredients: string[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  caloriesPerServing: number;
  nutrition?: RecipeNutrition;
  image: string;
  media: MediaItem[];
  rating: number;
  tags: string[];
  mealType: string[];
  ownerId: string;
  likeCount: number;
  likedByMe: boolean;
  viewCount: number;
  moderationStatus: string;
  commentCount: number;
}
