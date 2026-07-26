import { fail } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, type Failure, ValidationFailure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { IRecipeRepository } from '@domain/recipes/i-recipe-repository';

import type { ImportInstagramRecipeInput } from '@application/recipes/import/import-instagram-recipe-input';
import { ValueConstants } from '@core/constants';

const INSTAGRAM_HOSTS = ['instagram.com', 'www.instagram.com'];

/**
 * Imports an Instagram reel/video into a preview `Recipe`. Two client-side
 * guards short-circuit before the network so a slow (~120s) backend round-trip
 * is never wasted on input that cannot succeed: a blank URL fails as
 * `errors.import.invalid_url`, and a URL that does not parse or whose host is
 * not Instagram fails as `errors.import.not_instagram`. The returned recipe is
 * a NON-persisted preview (same contract as `generateRecipe`).
 *
 * Those keys ride on `messageKey` — the SAME channel the backend uses for the
 * identical rules — so presentation resolves copy for a locally-refused URL and
 * a server-refused one through one lookup. `message` stays what it is meant to
 * be: a developer sentence for logs, never an i18n key.
 */
export class ImportInstagramRecipeUseCase {
  constructor(private readonly repo: IRecipeRepository) {}

  execute(input: ImportInstagramRecipeInput): Promise<Result<RecipeEntity, Failure>> {
    const trimmed = input.url.trim();
    if (trimmed.length === ValueConstants.zero) {
      return Promise.resolve(
        fail(
          new ValidationFailure(
            'Instagram URL is required',
            undefined,
            ErrorMessageKey.importInvalidUrl,
          ),
        ),
      );
    }
    let host: string;
    try {
      host = new URL(trimmed).hostname;
    } catch {
      return Promise.resolve(fail(this.notInstagram(trimmed)));
    }
    if (!INSTAGRAM_HOSTS.includes(host.toLowerCase())) {
      return Promise.resolve(fail(this.notInstagram(trimmed)));
    }
    return this.repo.importInstagramRecipe(trimmed);
  }

  /**
   * NOTE the parenthesised url: `ValidationFailure.fieldErrors` splits `message`
   * on `': '`, so a colon here would parse back as a phantom field named
   * "Not an Instagram URL".
   */
  private notInstagram(url: string): ValidationFailure {
    return new ValidationFailure(
      `Not an Instagram URL (${url})`,
      undefined,
      ErrorMessageKey.importNotInstagram,
    );
  }
}
