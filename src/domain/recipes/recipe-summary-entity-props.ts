import type { Difficulty } from '@domain/recipes/difficulty';
import type { FocalPoint } from '@domain/recipes/media/focal-point';
import type { ImageCredit } from '@domain/recipes/media/image-credit';
import type { NutritionSourceType } from '@domain/recipes/nutrition/nutrition-source';
import type { RecipeOriginType } from '@domain/recipes/provenance/recipe-origin';
import type { SourcePlatformType } from '@domain/recipes/provenance/source-platform';

export interface RecipeSummaryEntityProps {
  id: string;
  name: string;
  image: string;
  /** Where the dish sits in the cover; absent reads as a centred crop. */
  imageFocus?: FocalPoint;
  /** Who took the cover photo and under which licence; absent for the owner's own photo. */
  imageCredit?: ImageCredit;
  // Opaque taxonomy keys — see `RecipeEntityProps.cuisine` in `recipe.ts` for why
  // these stay `string` rather than the local curated enums.
  cuisine: string;
  category: string;
  difficulty: Difficulty;
  /** `null` when the source has no timing — the UI hides the chip rather than inventing one. */
  totalTimeMinutes: number | null;
  rating: number;
  /** Whether the owner has put it out; the owner's grid badge reads this. */
  isPublished: boolean;
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
  /** Which platform an import came from; the card draws that platform's mark. */
  sourcePlatform: SourcePlatformType | null;
  /** Whether a model produced the text. A card can show both marks at once. */
  aiWritten: boolean;
  /** How many photos the recipe has; `0` from a server that does not send it, which hides the card chip. */
  photoCount: number;
  /**
   * Kcal per serving; 0 (or absent, from a server that predates it) means
   * unknown. Optional so a summary built before the field existed still is one.
   */
  caloriesPerServing?: number;
  /** Where the nutrition figures were looked up; absent when they were estimated. */
  nutritionSource?: NutritionSourceType;
}
