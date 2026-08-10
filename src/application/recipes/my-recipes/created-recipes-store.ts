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
  // WHY: owner-mutation flows must keep the public feed and detail cache in
  // sync. Without this, the recipe list at /recipes and the detail page show
  // stale data after a delete until the next full reload.
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
    // WHY: localRecipes is the source of truth for `findById`; recipes (the
    // lean "My Recipes" grid data) is kept in sync alongside it via
    // `recipeToSummary` so a create/delete doesn't need a re-fetch to
    // show up in both places. The conversion only fails on the
    // practically-impossible case of an already-valid Recipe producing an
    // invalid RecipeSummaryEntity — skip the lean-list update in that case.
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
    // The try/catch is not defensive dressing: this action owns the only state
    // the publish button reads, so ANY throw between `Creating` and a terminal
    // status leaves the button saying "Publishing…" with no way back. That is
    // what a revoked `blob:` URL did — `fetch()` on it rejects while building
    // the multipart body, the rejection escaped, and the screen sat there for
    // as long as the user was willing to wait. Everything here is `Result`-based
    // by convention, so a throw is by definition something nobody predicted,
    // which is exactly when a stuck spinner is least acceptable.
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
      // Only the FIRST load announces itself: a reload of a grid that is
      // already on screen keeps its `Loaded` state, or every re-focus — and
      // every pull-to-refresh — would swap the rows for a skeleton.
      if (get().myRecipesState.status !== StoreStatus.Loaded) {
        set({ myRecipesState: { status: StoreStatus.Loading } });
      }
      const result = await deps.listMyRecipesUseCase.execute();
      if (requested !== session) return;
      if (!result.ok) {
        // The rows already on screen stay: a failed reload must not blank the
        // grid the user is looking at.
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
      // WHY: the backend does NOT persist generated recipes — `/recipes/generate`
      // returns a preview with a throwaway id (see backend GenerateRecipeUseCase:
      // "the recipe is NOT persisted; that's the client's choice via POST /recipes").
      // So we surface it only as `aiDraft` to pre-fill the wizard. It must NOT be
      // prepended to `recipes`, otherwise "My Recipes" would show a phantom entry
      // that does not exist on the server until the user publishes it.
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
      // WHY: the backend does NOT persist imported recipes — `/recipes/import`
      // returns a preview with a throwaway id (same contract as generate). So we
      // surface it only as `aiDraft` to pre-fill the wizard. It must NOT be
      // prepended to `recipes`, otherwise "My Recipes" would show a phantom entry
      // that does not exist on the server until the user publishes it.
      set({
        importState: { status: StoreStatus.Success, recipe },
        aiDraft: recipe,
      });
    },
    refineRecipe: async (currentRecipe, instruction) => {
      set({ refineState: { status: StoreStatus.Refining } });
      const result = await deps.refineRecipeUseCase.execute({ currentRecipe, instruction });
      if (!result.ok) {
        set({ refineState: { status: StoreStatus.Error, failure: result.failure } });
        return null;
      }
      const refined = result.value;
      // WHY: refine returns a NOT-persisted preview (same contract as generate).
      // It is surfaced via refineState only and must NOT be prepended to
      // `recipes`, which would create a phantom "My Recipes" entry. The full
      // RefinedRecipe (recipe + AI summary/suggestion) is returned so the
      // caller can surface the natural-language commentary.
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
