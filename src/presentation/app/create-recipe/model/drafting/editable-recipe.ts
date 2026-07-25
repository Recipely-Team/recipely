import type { MediaItem } from '@domain/recipes/media/media-item';
import type { Difficulty } from '@domain/recipes/difficulty';

/**
 * The live, inline-editable working model of a recipe inside the unified AI
 * create flow. Cuisine is an opaque taxonomy key chosen from the backend
 * catalog (no longer free text, and not narrowed to the local enum); `null`
 * means the user has not picked one yet. `category` is always set (defaulting
 * to the generated recipe's category) so publishing preserves it.
 */
export interface EditableRecipe {
  name: string;
  cuisine: string | null;
  category: string;
  difficulty: Difficulty;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
  media: MediaItem[];
}
