import { fail } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RefinedRecipe } from '@domain/recipes/refine/refined-recipe';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import { RefineInstruction } from '@domain/recipes/refine/refine-instruction';
import type { RefineRecipeInput } from '@application/recipes/refine/refine-recipe-input';

/**
 * Refines an in-progress recipe against a free-text instruction, returning a
 * `RefinedRecipe` read model (NOT-persisted preview `Recipe` plus the AI's
 * `summary` / `suggestion`). A blank instruction fails as {@link RefineInstruction}
 * says, without hitting the network.
 */
export class RefineRecipeUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  async execute(input: RefineRecipeInput): Promise<Result<RefinedRecipe, Failure>> {
    const instruction = RefineInstruction.create(input.instruction);
    if (!instruction.ok) return fail(instruction.failure);
    return this.repo.refineRecipe(input.currentRecipe, instruction.value.value, input.history);
  }
}
