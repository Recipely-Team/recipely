import { RecipeOrigin, type RecipeOriginType } from '@domain/recipes/provenance/recipe-origin';
import type { SourcePlatformType } from '@domain/recipes/provenance/source-platform';
import { ProvenanceMark, type ProvenanceMarkType } from '@domain/recipes/provenance/provenance-mark';

/**
 * The marks a recipe's seal carries — empty for a recipe a person wrote.
 *
 * @remarks
 * - **Platform first, then AI.** The platform names where the recipe came
 *   from and the AI mark qualifies how it was written; reading left to right
 *   that is the order the detail sentence tells it in.
 * - **An unknown platform draws no platform mark**, the same honesty
 *   `toSourcePlatform` applies: an import from somewhere this build cannot
 *   name still says a model wrote it, and says nothing about where.
 * - **`origin === Ai` is AI even without the flag**, so a row written before
 *   `aiWritten` existed cannot lose its mark.
 */
export const toProvenanceMarks = (
  origin: RecipeOriginType,
  sourcePlatform: SourcePlatformType | null,
  aiWritten: boolean,
): readonly ProvenanceMarkType[] => {
  const byModel = aiWritten || origin === RecipeOrigin.Ai;
  const marks: ProvenanceMarkType[] = sourcePlatform === null ? [] : [sourcePlatform];
  if (byModel) marks.push(ProvenanceMark.Ai);
  return marks;
};
