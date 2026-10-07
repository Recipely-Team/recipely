import { fail, flatMapResult } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import type { ImportInstagramRecipeInput } from '@application/recipes/import/import-instagram-recipe-input';
import { ImportLink } from '@domain/recipes/import/import-link';
import { SourcePlatform } from '@domain/recipes/provenance/source-platform';

/**
 * Imports an Instagram reel/video into a preview `Recipe` through the legacy
 * synchronous endpoint, which runs only Instagram. The link is judged by
 * {@link ImportLink} — the same rule the queue and the paste screen apply, so
 * there is no second allowlist here to drift — and anything it does not class
 * as an Instagram post fails as `errors.import.unsupported_source` before the ~120 s
 * round trip. The returned recipe is a NON-persisted preview (same contract as
 * `generateRecipe`).
 */
export class ImportInstagramRecipeUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  async execute(input: ImportInstagramRecipeInput): Promise<Result<RecipeEntity, Failure>> {
    const link = flatMapResult(ImportLink.create(input.url), (l) => l.requirePlatform(SourcePlatform.Instagram));
    return link.ok ? this.repo.importInstagramRecipe(link.value.value) : fail(link.failure);
  }
}
