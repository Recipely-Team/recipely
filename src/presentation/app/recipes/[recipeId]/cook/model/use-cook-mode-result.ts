import type { CookRecipeState } from '@presentation/app/recipes/[recipeId]/cook/model/cook-recipe-state';
import type { StepNavigation } from '@presentation/app/recipes/[recipeId]/cook/model/step-navigation';

/** What `useCookMode` hands the cook-mode screen. */
export interface UseCookModeResult {
  recipeId: string;
  state: CookRecipeState;
  recipeName: string;
  /** The recipe's steps; empty until it is ready. */
  steps: readonly string[];
  ingredients: readonly string[];
  navigation: StepNavigation;
  completedSteps: readonly boolean[];
  /** The step on screen; empty until the recipe is ready. */
  currentStep: string;
  /** Minutes the step on screen names, or `null` — no timer is offered then. */
  stepMinutes: number | null;
  onToggleStep: (index: number) => void;
  /** Ticks the step on screen and moves on; on the last step it finishes. */
  onNext: () => void;
  onPrevious: () => void;
  /** +1 forward, -1 back, from a swipe. */
  onSwipe: (direction: number) => void;
  isIngredientsOpen: boolean;
  openIngredients: () => void;
  closeIngredients: () => void;
  onExit: () => void;
  onRetry: () => void;
}
