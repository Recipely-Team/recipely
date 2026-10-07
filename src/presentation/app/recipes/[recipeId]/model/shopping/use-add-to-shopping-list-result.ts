/** "Add to shopping list" on a recipe, as `useAddToShoppingList` exposes it. */
export interface UseAddToShoppingListResult {
  /** False when the recipe has no ingredient to buy, which hides the button. */
  canAdd: boolean;
  isAdding: boolean;
  /** Adds the lines — or, for a guest, opens the sign-in prompt. */
  add: () => void;
  promptVisible: boolean;
  promptMessage: string | undefined;
  closePrompt: () => void;
  goToSignIn: () => void;
}
