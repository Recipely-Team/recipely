import type { MediaItem } from '@domain/recipes/media/media-item';
import type { FocalPoint } from '@domain/recipes/media/focal-point';
import type { ImageCredit } from '@domain/recipes/media/image-credit';
import type { NutritionSourceType } from '@domain/recipes/nutrition/nutrition-source';
import type { Difficulty } from '@domain/recipes/difficulty';
import type { RecipeNutrition } from '@domain/recipes/recipe-nutrition';
import type { RecipeOriginType } from '@domain/recipes/provenance/recipe-origin';
import type { SourcePlatformType } from '@domain/recipes/provenance/source-platform';
import type { PublishBlockerType } from '@domain/recipes/publishing/publish-blocker';

export interface RecipeEntityProps {
  id: string;
  name: string;
  // Opaque backend taxonomy keys, not the local curated enums.
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
  /** Where the nutrition figures were looked up; absent when they were estimated. */
  nutritionSource?: NutritionSourceType;
  image: string;
  /** Where the dish sits in the cover; absent reads as a centred crop. */
  imageFocus?: FocalPoint;
  /** Who took the cover photo and under which licence; absent for the owner's own photo. */
  imageCredit?: ImageCredit;
  media: MediaItem[];
  rating: number;
  tags: string[];
  mealType: string[];
  ownerId: string;
  likeCount: number;
  likedByMe: boolean;
  viewCount: number;
  /** Where the text came from; `User` for anything this app does not know. */
  origin: RecipeOriginType;
  /** The post an import came from, when there is one. */
  sourceUrl?: string;
  /** The account that posted it, without the '@'. */
  sourceHandle?: string;
  /** Which platform an import came from; `null` when nothing was imported. */
  sourcePlatform: SourcePlatformType | null;
  /** Whether a model produced the text — true for a generation AND an import. */
  aiWritten: boolean;
  /** Whether the owner has put it out; see `ModerationStatus` for the review half. */
  isPublished: boolean;
  moderationStatus: string;
  /**
   * What still keeps a website import from being published. Sent to the owner
   * only, so absent for everyone else — optional data, not a viewer flag.
   */
  publishBlockers?: readonly PublishBlockerType[];
  commentCount: number;
}
