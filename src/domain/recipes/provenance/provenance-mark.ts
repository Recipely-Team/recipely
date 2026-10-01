import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';
import { SourcePlatform } from '@domain/recipes/provenance/source-platform';

/**
 * One mark on a recipe's provenance seal.
 *
 * @remarks
 * - **Two independent facts, one list.** A platform mark says where the video
 *   came from; the AI mark says a model wrote the text. An import from TikTok
 *   that a model turned into a recipe carries both, platform first.
 * - **References, not re-spellings.** A platform IS its mark, so a platform
 *   maps to one without a lookup table — and a new `SourcePlatform` with no
 *   mark here fails to compile in `toProvenanceMarks`.
 * - **`Curated` stands alone.** Recipely Kitchen is its own source; it never
 *   shares the capsule with a platform or the AI mark.
 */
export const ProvenanceMark = {
  Instagram: SourcePlatform.Instagram,
  TikTok: SourcePlatform.TikTok,
  Facebook: SourcePlatform.Facebook,
  YouTube: SourcePlatform.YouTube,
  Web: SourcePlatform.Web,
  Ai: RecipeOrigin.Ai,
  Curated: RecipeOrigin.Curated,
} as const;

export type ProvenanceMarkType = (typeof ProvenanceMark)[keyof typeof ProvenanceMark];
