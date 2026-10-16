import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import { guessedLinesOf } from '@domain/drafts/guessed-lines-of';
import { toSourcePlatform } from '@domain/recipes/provenance/to-source-platform';
import type { ImportReview } from '@presentation/app/create-recipe/model/review/import-review';

/** The editor's import review for a draft, or null for anything that is not an import with a reading. */
export const importReviewOf = (snapshot: DraftRecipeSnapshot | undefined): ImportReview | null => {
  const reading = snapshot?.importReading;
  if (snapshot === undefined || reading === undefined) return null;
  return {
    suggested: reading.suggested,
    ...(reading.sourceText !== undefined && reading.sourceText.trim().length > 0 ? { sourceText: reading.sourceText } : {}),
    ...(snapshot.sourceUrl !== undefined ? { sourceUrl: snapshot.sourceUrl } : {}),
    sourcePlatform: toSourcePlatform(snapshot.sourcePlatform),
    guessed: guessedLinesOf(snapshot),
  };
};
