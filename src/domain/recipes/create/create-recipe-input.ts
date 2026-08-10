import type { Difficulty } from '@domain/recipes/difficulty';
import type { RecipeMediaUpload } from '@domain/recipes/media/recipe-media-upload';

export interface CreateRecipeInput {
  name: Record<string, string>;
  // Opaque taxonomy key validated by the backend (the source of truth for the
  // full catalog); not narrowed to the local `CuisineKey`/`RecipeCategory`
  // enums, which only mirror a curated subset.
  cuisine: string;
  category: string;
  difficulty: Difficulty;
  ingredients: Record<string, string[]>;
  instructions: Record<string, string[]>;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  // Ordered gallery (cover first), as LOCAL files to upload.
  media: RecipeMediaUpload[];
  /**
   * A cover the backend already hosts, passed through instead of uploaded.
   *
   * An Instagram import comes back with a frame the importer lifted out of the
   * video and stored server-side, so the editor already has a picture. Sending
   * that URL back as a file would ask the device to upload something it never
   * had — the create endpoint takes it as a plain field and uses it when no
   * file is uploaded. Anything in `media` wins over this: a photo the user
   * picked themselves should beat one a machine chose for them.
   */
  imageUrl?: string;
  rating?: number;
  tags?: Record<string, string[]>;
  mealType?: Record<string, string[]>;
  isPublished?: boolean;
  locale?: string;
}
