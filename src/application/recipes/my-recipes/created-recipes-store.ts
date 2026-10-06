import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { UnknownFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { create } from 'zustand';
import { ValueConstants } from '@core/constants';
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

export const configureCreatedRecipesStore = (deps: CreatedRecipesStoreDeps): BoundStore<CreatedRecipesStoreState> => {
  /**
   * Bumped by `clear()`. A list load that started under an earlier session must
   * not publish its answer — signing out mid-request put the previous account's
   * recipes back into the grid.
   */
  let session = ValueConstants.zero;

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
        const summary = recipeToSummary(recipe);
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
    // Any throw must still end in a terminal status, or the publish button stays busy.
    createRecipe: async (input, onProgress) => {
      set({ createState: { status: StoreStatus.Creating } });
      try {
        const result = await deps.createRecipeUseCase.execute(input, onProgress);
        if (!result.ok) {
          set({ createState: { status: StoreStatus.Error, failure: result.failure } });
          return;
        }
        const recipe = result.value;
        get().add(recipe);
        // The saved recipe's page opens next, and its status panel reads this cache.
        deps.recipeDetailStore.getState().put(recipe);
        set({ createState: { status: StoreStatus.Success, recipe } });
      } catch (error) {
        set({
          createState: {
            status: StoreStatus.Error,
            failure: new UnknownFailure(DiagnosticMessage.recipeCreate.threw, error),
          },
        });
      }
    },
    loadMyRecipes: async () => {
      const requested = session;
      // Only the first load shows a skeleton; reloads keep the rows.
      if (get().myRecipesState.status !== StoreStatus.Loaded) {
        set({ myRecipesState: { status: StoreStatus.Loading } });
      }
      const result = await deps.listMyRecipesUseCase.execute();
      if (requested !== session) return;
      if (!result.ok) {
        set({ myRecipesState: { status: StoreStatus.Error, failure: result.failure } });
        return;
      }
      set({ recipes: result.value.items, myRecipesState: { status: StoreStatus.Loaded } });
    },
    generateRecipe: async (prompt) => {
      set({ generateState: { status: StoreStatus.Generating } });
      const result = await deps.generateRecipeUseCase.execute({ prompt });
      if (!result.ok) {
        set({ generateState: { status: StoreStatus.Error, failure: result.failure } });
        return;
      }
      const recipe = result.value;
      // Generated recipes are previews (not persisted): aiDraft only, never in the list.
      set({
        generateState: { status: StoreStatus.Success, recipe },
        aiDraft: recipe,
      });
    },
    importInstagram: async (url) => {
      set({ importState: { status: StoreStatus.Generating } });
      const result = await deps.importInstagramRecipeUseCase.execute({ url });
      if (!result.ok) {
        set({ importState: { status: StoreStatus.Error, failure: result.failure } });
        return;
      }
      const recipe = result.value;
      // Imported recipes are previews too: aiDraft only.
      set({
        importState: { status: StoreStatus.Success, recipe },
        aiDraft: recipe,
      });
    },
    refineRecipe: async (currentRecipe, instruction, history) => {
      set({ refineState: { status: StoreStatus.Refining } });
      const result = await deps.refineRecipeUseCase.execute({ currentRecipe, instruction, history });
      if (!result.ok) {
        set({ refineState: { status: StoreStatus.Error, failure: result.failure } });
        return null;
      }
      const refined = result.value;
      // Refine returns a preview: refineState only.
      set({ refineState: { status: StoreStatus.Success, recipe: refined.recipe } });
      return refined;
    },
    deleteRecipe: async (id) => {
      set({ deleteState: { status: StoreStatus.Deleting } });
      const result = await deps.deleteRecipeUseCase.execute(id);
      if (!result.ok) {
        set({ deleteState: { status: StoreStatus.Error, failure: result.failure } });
        return;
      }
      get().remove(id);
      deps.recipeListStore.getState().remove(id);
      deps.recipeDetailStore.getState().remove(id);
      set({ deleteState: { status: StoreStatus.Success } });
    },
    resetCreateState: () => set({ createState: { status: StoreStatus.Idle } }),
    resetGenerateState: () => set({ generateState: { status: StoreStatus.Idle } }),
    resetImportState: () => set({ importState: { status: StoreStatus.Idle } }),
    resetRefineState: () => set({ refineState: { status: StoreStatus.Idle } }),
    resetDeleteState: () => set({ deleteState: { status: StoreStatus.Idle } }),
    clearAiDraft: () => set({ aiDraft: null }),
    clear: () => {
      session += ValueConstants.one;
      set({
        recipes: [],
        myRecipesState: { status: StoreStatus.Idle },
        localRecipes: [],
        aiDraft: null,
      });
    },
  }));
};
