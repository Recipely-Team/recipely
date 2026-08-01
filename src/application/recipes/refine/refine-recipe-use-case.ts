import { fail } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, type Failure, ValidationFailure } from '@core/failure';
import type { RefinedRecipe } from '@domain/recipes/refine/refined-recipe';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import type { RefineRecipeInput } from '@application/recipes/refine/refine-recipe-input';
import { ValueConstants } from '@core/constants';

/**
 * Refines an in-progress recipe against a free-text instruction, returning a
 * `RefinedRecipe` read model (NOT-persisted preview `Recipe` plus the AI's
 * `summary` / `suggestion`). Returns a `ValidationFailure` keyed
 * `errors.ai.refine_instruction_required` immediately when the instruction is
 * blank, without hitting the network — its OWN key, not generate's: with a
 * recipe already on screen the user must be told what to CHANGE, not what to
 * cook.
 */
export class RefineRecipeUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(input: RefineRecipeInput): Promise<Result<RefinedRecipe, Failure>> {
    const trimmed = input.instruction.trim();
    if (trimmed.length === ValueConstants.zero) {
      return Promise.resolve(
        fail(
          new ValidationFailure(
            DiagnosticMessage.ai.refineInstructionRequired,
            undefined,
            ErrorMessageKey.refineInstructionRequired,
          ),
        ),
      );
    }
    return this.repo.refineRecipe(input.currentRecipe, trimmed);
  }
}
