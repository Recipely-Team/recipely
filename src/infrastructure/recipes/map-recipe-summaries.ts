import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';
import { toRecipeSummary } from '@infrastructure/recipes/recipe-mapper';

/**
 * Maps a page of lean recipe list DTOs to domain `RecipeSummaryEntity` values,
 * skipping any row that cannot be read.
 *
 * @remarks
 * - **One odd row must not empty a list.** This used to stop at the first
 *   unreadable row, so a single recipe with a blank name failed the whole page:
 *   Saved, Liked, Created, the feed, a profile or a creator page went blank and
 *   its tab badge vanished, while `toPage` promised the opposite.
 * - The page's `total` still comes from the server; a skipped row is a data
 *   problem to fix there, not a reason to hide the other rows.
 */
export const mapRecipeSummaries = (items: RecipeListItemDto[]): Result<RecipeSummaryEntity[], Failure> => {
  const summaries: RecipeSummaryEntity[] = [];
  for (const dto of items) {
    const mapped = toRecipeSummary(dto);
    if (mapped.ok) summaries.push(mapped.value);
  }
  return ok(summaries);
};
