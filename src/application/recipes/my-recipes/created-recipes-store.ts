import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import type { Failure } from '@core/failure';
import type { Result } from '@core/result/result';
import { RequestEpoch } from '@application/store/request-epoch';
import { create } from 'zustand';
import { recipeToSummary } from '@domain/recipes/recipe-to-summary';
import type { CreatedRecipesStoreState } from '@application/recipes/my-recipes/created-recipes-store-state';
import type { CreateRecipeUseCase } from '@application/recipes/create/create-recipe-use-case';
import type { ListMyRecipesUseCase } from '@application/recipes/my-recipes/list-my-recipes-use-case';
import type { GenerateRecipeUseCase } from '@application/recipes/generate/generate-recipe-use-case';
import type { ImportInstagramRecipeUseCase } from '@application/recipes/import/import-instagram-recipe-use-case';
import type { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import type { DeleteRecipeUseCase } from '@application/recipes/delete/delete-recipe-use-case';
import type { RecipeDetailStoreState } from '@application/recipes/detail/recipe-detail-store-state';
import type { RecipeListStoreState } from '@application/recipes/list/recipe-list-store-state';
import type { CreateRecipeState } from '@application/recipes/create/create-recipe-state';
import type { GenerateRecipeState } from '@application/recipes/generate/generate-recipe-state';
import type { RefineRecipeState } from '@application/recipes/refine/refine-recipe-state';
import type { DeleteRecipeState } from '@application/recipes/delete/delete-recipe-state';

interface CreatedRecipesStoreDeps {
  createRecipeUseCase: CreateRecipeUseCase;
  listMyRecipesUseCase: ListMyRecipesUseCase;
  generateRecipeUseCase: GenerateRecipeUseCase;
  importInstagramRecipeUseCase: ImportInstagramRecipeUseCase;
  refineRecipeUseCase: RefineRecipeUseCase;
  deleteRecipeUseCase: DeleteRecipeUseCase;
  // Owner mutations keep the public feed and detail cache in sync.
  recipeListStore: BoundStore<RecipeListStoreState>;
  recipeDetailStore: BoundStore<RecipeDetailStoreState>;
}

/** The failed variant every operation state in this store shares. */
type OperationFailed = { status: typeof StoreStatus.Error; failure: Failure };

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

export const configureCreatedRecipesStore = (deps: CreatedRecipesStoreDeps): BoundStore<CreatedRecipesStoreState> => {
  // `clear()` invalidates it: a list load from an earlier session must not put that account's recipes back.
  const listEpoch = new RequestEpoch();


  return create<CreatedRecipesStoreState>((set, get) => ({
    recipes: [],
    myRecipesState: { status: StoreStatus.Idle },
    localRecipes: [],
    createState: { status: StoreStatus.Idle },
    generateState: { status: StoreStatus.Idle },
    importState: { status: StoreStatus.Idle },
    deleteState: { status: StoreStatus.Idle },
    refineState: { status: StoreStatus.Idle },
    aiDraft: null,
    // localRecipes backs findById; the lean grid list is kept in sync alongside it.
    add: (recipe) =>
      set((s) => {
        const summary = recipeToSummary(recipe, false);
        return {
          localRecipes: [recipe, ...s.localRecipes],
          recipes: summary.ok ? [summary.value, ...s.recipes] : s.recipes,
        };
      }),
    remove: (id) =>
      set((s) => ({
        localRecipes: s.localRecipes.filter((r) => r.id !== id),
        recipes: s.recipes.filter((r) => r.id !== id),
      })),
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
    loadMyRecipes: async () => {
      const isCurrent = listEpoch.start();
      // Only the first load shows a skeleton; reloads keep the rows.
      if (get().myRecipesState.status !== StoreStatus.Loaded) {
        set({ myRecipesState: { status: StoreStatus.Loading } });
      }
      const result = await deps.listMyRecipesUseCase.execute();
      if (!isCurrent()) return;
      if (!result.ok) {
        set({ myRecipesState: { status: StoreStatus.Error, failure: result.failure } });
        return;
      }
      set({ recipes: result.value.items, myRecipesState: { status: StoreStatus.Loaded } });
    },
    // Generated and imported recipes are previews (not persisted): aiDraft only, never in the list.
    generateRecipe: async (prompt) => {
      await runOperation(
        (generateState: GenerateRecipeState) => set({ generateState }),
        { status: StoreStatus.Generating },
        deps.generateRecipeUseCase.execute({ prompt }),
        (recipe) => {
          set({ aiDraft: recipe });
          return { status: StoreStatus.Success, recipe };
        },
      );
    },
    importInstagram: async (url) => {
      await runOperation(
        (importState: GenerateRecipeState) => set({ importState }),
        { status: StoreStatus.Generating },
        deps.importInstagramRecipeUseCase.execute({ url }),
        (recipe) => {
          set({ aiDraft: recipe });
          return { status: StoreStatus.Success, recipe };
        },
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
    resetImportState: () => set({ importState: { status: StoreStatus.Idle } }),
    resetRefineState: () => set({ refineState: { status: StoreStatus.Idle } }),
    resetDeleteState: () => set({ deleteState: { status: StoreStatus.Idle } }),
    clearAiDraft: () => set({ aiDraft: null }),
    clear: () => {
      listEpoch.invalidate();
      set({
        recipes: [],
        myRecipesState: { status: StoreStatus.Idle },
        localRecipes: [],
        aiDraft: null,
      });
    },
  }));
};
