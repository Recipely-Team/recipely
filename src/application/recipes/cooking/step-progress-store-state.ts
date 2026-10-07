/**
 * Which instruction steps the cook has ticked, per recipe, for this app session.
 *
 * @remarks
 * - **Shared by the recipe page and cook mode.** Both show the same steps; a
 *   step ticked while cooking reads as done when the cook steps back to the
 *   recipe, and the other way round.
 * - **In memory only.** Progress is about the pan on the hob now, not a record
 *   worth persisting or syncing.
 */
export interface StepProgressStoreState {
  /** Ticked flags by recipe id, indexed like the recipe's `instructions`. */
  byRecipe: Readonly<Record<string, readonly boolean[]>>;
  toggleStep: (recipeId: string, index: number) => void;
  /** Sets one step's flag explicitly. */
  setStepDone: (recipeId: string, index: number, done: boolean) => void;
  clear: () => void;
}
