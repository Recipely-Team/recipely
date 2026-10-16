/**
 * What an import read, as the backend keeps it on the draft
 * (recipely-backend #418): whether the recipe was written for a dish the post
 * showed but did not give, the caption and transcript the model read (in the
 * post's language), and the lines it filled in rather than read.
 */
export interface ImportReading {
  readonly suggested: boolean;
  readonly sourceText?: string;
  readonly guessedIngredients: readonly number[];
  readonly guessedSteps: readonly number[];
}
