import type { Nutrients } from '@domain/diary/nutrition/nutrients';

export interface LoggableFoodProps {
  readonly name: string;
  /** Nutrients of ONE serving. */
  readonly perServing: Nutrients;
  readonly recipeId: string | null;
  readonly imageUrl: string | null;
}
