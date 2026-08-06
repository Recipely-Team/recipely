import { fail } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, type Failure, ValidationFailure } from '@core/failure';
import type { ImportJob } from '@domain/recipes/import/import-job';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import type { ImportInstagramRecipeInput } from '@application/recipes/import/import-instagram-recipe-input';
import { ValueConstants } from '@core/constants';

const INSTAGRAM_HOSTS = ['instagram.com', 'www.instagram.com'];

/**
 * Queues an Instagram import and returns a receipt, without waiting for it.
 *
 * @remarks
 * - **Why not just call the old use case.** That one holds a request open for
 *   the 59-128 s the pipeline takes. A phone that backgrounds the app kills the
 *   socket and the result is lost entirely — the work was done and thrown away.
 *   Here the job outlives the request and the user is told when it lands.
 * - **The same two client-side guards.** A blank or non-Instagram URL is
 *   refused before the network, because the backend applies exactly these rules
 *   and a round-trip to be told so is a round-trip wasted. The keys ride on
 *   `messageKey`, the same channel the backend uses, so presentation resolves a
 *   locally-refused URL and a server-refused one through one lookup.
 */
export class EnqueueInstagramImportUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(input: ImportInstagramRecipeInput): Promise<Result<ImportJob, Failure>> {
    const trimmed = input.url.trim();
    if (trimmed.length === ValueConstants.zero) {
      return Promise.resolve(
        fail(
          new ValidationFailure(
            DiagnosticMessage.recipeImport.urlRequired,
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
    return this.repo.enqueueInstagramImport(trimmed);
  }

  /**
   * NOTE the parenthesised url: `ValidationFailure.fieldErrors` splits `message`
   * on `': '`, so a colon here would parse back as a phantom field.
   */
  private notInstagram(url: string): ValidationFailure {
    return new ValidationFailure(
      DiagnosticMessage.recipeImport.notAnInstagramUrl(url),
      undefined,
      ErrorMessageKey.importNotInstagram,
    );
  }
}
