import { configureRecipeDetailStore } from '@application/recipes/detail/recipe-detail-store';
import { StoreStatus } from '@application/store/store-status';
import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeDetail } from '@domain/recipes/recipe-detail';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import type { AddRecipePhotoUseCase } from '@application/recipes/photos/add-recipe-photo-use-case';
import { GetRecipeUseCase } from '@application/recipes/detail/get-recipe-use-case';
import type { RemoveRecipeMediaUseCase } from '@application/recipes/photos/remove-recipe-media-use-case';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';

const RECIPE_ID = 'recipe-1';

type Answer = Result<RecipeDetail, Failure>;

/** A store whose recipe fetches the test answers by hand, in any order. */
const deferredStore = () => {
  const pending: ((answer: Answer) => void)[] = [];
  const store = configureRecipeDetailStore({
    getRecipe: new GetRecipeUseCase({
      getRecipe: () => new Promise<Answer>((resolve) => pending.push(resolve)),
    } as Partial<RecipeRepositoryInterface> as RecipeRepositoryInterface),
    addRecipePhoto: {} as AddRecipePhotoUseCase,
    removeRecipeMedia: {} as RemoveRecipeMediaUseCase,
  });
  return { store, pending };
};

const liked = (likedByMe: boolean, name = 'Soup'): Answer => ok({ recipe: recipeEntityOf({ id: RECIPE_ID, name }), likedByMe });

/**
 * Review finding: `load` had no session guard, so a recipe answer landing after
 * sign-out wrote the previous account's like back into the cleared store, and an
 * older answer could overwrite a newer one.
 */
describe('recipeDetailStore — answers that outlive their request', () => {
  it('a recipe answer that lands after sign-out does not bring back the previous account\'s like', async () => {
    const { store, pending } = deferredStore();
    const loading = store.getState().load(RECIPE_ID);
    store.getState().clear();
    pending[0]!(liked(true));
    await loading;

    expect(store.getState().byId).toEqual({});
  });

  it('an older answer landing after a newer one does not overwrite it', async () => {
    const { store, pending } = deferredStore();
    const first = store.getState().load(RECIPE_ID);
    const second = store.getState().load(RECIPE_ID);
    pending[1]!(liked(false, 'New'));
    await second;
    pending[0]!(liked(true, 'Old'));
    await first;

    const state = store.getState().byId[RECIPE_ID];
    expect(state?.status === StoreStatus.Loaded && [state.recipe.name, state.likedByMe]).toEqual(['New', false]);
  });
});
