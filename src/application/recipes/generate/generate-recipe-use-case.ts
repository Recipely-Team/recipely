import { fail } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import { GenerationPrompt } from '@domain/recipes/create/generation-prompt';
import type { GenerateRecipeInput } from '@application/recipes/generate/generate-recipe-input';

/**
 * Generates a recipe from a free-text AI prompt. A blank prompt fails as
 * {@link GenerationPrompt} says, without hitting the network.
 */
export class GenerateRecipeUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  async execute(input: GenerateRecipeInput): Promise<Result<RecipeEntity, Failure>> {
    const prompt = GenerationPrompt.create(input.prompt);
    return prompt.ok ? this.repo.generateRecipe(prompt.value.value) : fail(prompt.failure);
  }
}
