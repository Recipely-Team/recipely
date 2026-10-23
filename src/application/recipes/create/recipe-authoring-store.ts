import type { StoreApi } from 'zustand/vanilla';
import { StoreStatus } from '@application/store/store-status';
import type { Failure } from '@core/failure';
import type { Result } from '@core/result/result';
import { createStore } from 'zustand/vanilla';
import { recipeToSummary } from '@domain/recipes/recipe-to-summary';
import type { RecipeAuthoringStore } from '@application/recipes/create/recipe-authoring-store-contract';
import type { CreateRecipeUseCase } from '@application/recipes/create/create-recipe-use-case';
import type { GenerateRecipeUseCase } from '@application/recipes/generate/generate-recipe-use-case';
import type { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import type { DeleteRecipeUseCase } from '@application/recipes/delete/delete-recipe-use-case';
import type { RecipeDetailStore } from '@application/recipes/detail/recipe-detail-store-contract';
import type { RecipeListStore } from '@application/recipes/list/recipe-list-store-contract';
import type { MyRecipesStore } from '@application/recipes/my-recipes/my-recipes-store-contract';
import type { CreateRecipeState } from '@application/recipes/create/create-recipe-state';
import type { GenerateRecipeState } from '@application/recipes/generate/generate-recipe-state';
import type { RefineRecipeState } from '@application/recipes/refine/refine-recipe-state';
import type { DeleteRecipeState } from '@application/recipes/delete/delete-recipe-state';
import type { CreateRecipeError } from '@application/recipes/create/states/create-recipe-error';
import type { GenerateRecipeError } from '@application/recipes/generate/states/generate-recipe-error';
import type { RefineRecipeError } from '@application/recipes/refine/states/refine-recipe-error';
import type { DeleteRecipeError } from '@application/recipes/delete/states/delete-recipe-error';

interface RecipeAuthoringStoreDeps {
  createRecipeUseCase: CreateRecipeUseCase;
  generateRecipeUseCase: GenerateRecipeUseCase;
  refineRecipeUseCase: RefineRecipeUseCase;
  deleteRecipeUseCase: DeleteRecipeUseCase;
  // Owner mutations keep the public feed and detail cache in sync.
  recipeListStore: StoreApi<RecipeListStore>;
  recipeDetailStore: StoreApi<RecipeDetailStore>;
  // The Created list; a recipe made or deleted here is added to or removed from it.
  myRecipesStore: StoreApi<MyRecipesStore>;
}

/** The failed state of any operation this store runs; the four share one shape. */
type OperationFailed = CreateRecipeError | GenerateRecipeError | RefineRecipeError | DeleteRecipeError;

/**
 * One operation's state walk: busy, then the use case, then `Error` or what `onOk` builds
 * from the value (after its side effects). Answers the value, or `null` on failure.
 */
const runOperation = async <S, T>(
  write: (state: S | OperationFailed) => void,
  busy: NoInfer<S>,
  call: Promise<Result<T, Failure>>,
  onOk: (value: T) => NoInfer<S>,
): Promise<T | null> => {
  write(busy);
  const result = await call;
  if (!result.ok) {
    write({ status: StoreStatus.Error, failure: result.failure });
    return null;
  }
  write(onOk(result.value));
  return result.value;
};

export const configureRecipeAuthoringStore = (deps: RecipeAuthoringStoreDeps): StoreApi<RecipeAuthoringStore> => {
  return createStore<RecipeAuthoringStore>((set, get) => ({
    localRecipes: [],
    createState: { status: StoreStatus.Idle },
    generateState: { status: StoreStatus.Idle },
    deleteState: { status: StoreStatus.Idle },
    refineState: { status: StoreStatus.Idle },
    // localRecipes backs findById; the Created list is told about every recipe made or deleted here.
    add: (recipe) => {
      set((s) => ({ localRecipes: [recipe, ...s.localRecipes] }));
      const summary = recipeToSummary(recipe, false);
      if (summary.ok) deps.myRecipesStore.getState().addLocal(summary.value);
    },
    remove: (id) => {
      set((s) => ({ localRecipes: s.localRecipes.filter((r) => r.id !== id) }));
      deps.myRecipesStore.getState().removeLocal(id);
    },
    findById: (id) => get().localRecipes.find((r) => r.id === id),
    createRecipe: async (input, onProgress) => {
      await runOperation(
        (createState: CreateRecipeState) => set({ createState }),
        { status: StoreStatus.Creating },
        deps.createRecipeUseCase.execute(input, onProgress),
        (recipe) => {
          get().add(recipe);
          // The saved recipe's page opens next, and its status panel reads this cache.
          deps.recipeDetailStore.getState().put(recipe);
          return { status: StoreStatus.Success, recipe };
        },
      );
    },
    // A generated recipe is a preview (not persisted): it lives in generateState, never in the list.
    generateRecipe: async (prompt) => {
      await runOperation(
        (generateState: GenerateRecipeState) => set({ generateState }),
        { status: StoreStatus.Generating },
        deps.generateRecipeUseCase.execute({ prompt }),
        (recipe) => ({ status: StoreStatus.Success, recipe }),
      );
    },
    // Refine returns a preview: refineState only.
    refineRecipe: (currentRecipe, instruction, history) =>
      runOperation(
        (refineState: RefineRecipeState) => set({ refineState }),
        { status: StoreStatus.Refining },
        deps.refineRecipeUseCase.execute({ currentRecipe, instruction, history }),
        (refined) => ({ status: StoreStatus.Success, recipe: refined.recipe }),
      ),
    deleteRecipe: async (id) => {
      await runOperation(
        (deleteState: DeleteRecipeState) => set({ deleteState }),
        { status: StoreStatus.Deleting },
        deps.deleteRecipeUseCase.execute(id),
        () => {
          get().remove(id);
          deps.recipeListStore.getState().remove(id);
          deps.recipeDetailStore.getState().remove(id);
          return { status: StoreStatus.Success };
        },
      );
    },
    resetCreateState: () => set({ createState: { status: StoreStatus.Idle } }),
    resetGenerateState: () => set({ generateState: { status: StoreStatus.Idle } }),
    resetRefineState: () => set({ refineState: { status: StoreStatus.Idle } }),
    resetDeleteState: () => set({ deleteState: { status: StoreStatus.Idle } }),
    clear: () => set({ localRecipes: [] }),
  }));
};
