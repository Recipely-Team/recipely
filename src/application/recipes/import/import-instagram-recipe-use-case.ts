import { fail } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, type Failure, ValidationFailure } from '@core/failure';
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
 * as an Instagram post fails as `errors.import.not_instagram` before the ~120 s
 * round trip. The returned recipe is a NON-persisted preview (same contract as
 * `generateRecipe`).
 */
export class ImportInstagramRecipeUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(input: ImportInstagramRecipeInput): Promise<Result<RecipeEntity, Failure>> {
    const link = ImportLink.create(input.url);
    if (!link.ok) return Promise.resolve(fail(link.failure));
    if (link.value.platform !== SourcePlatform.Instagram) {
      return Promise.resolve(
        fail(
          new ValidationFailure(
            DiagnosticMessage.recipeImport.unsupportedSite(input.url.trim()),
            undefined,
            ErrorMessageKey.importNotInstagram,
          ),
        ),
      );
    }
    return this.repo.importInstagramRecipe(link.value.value);
  }
}
