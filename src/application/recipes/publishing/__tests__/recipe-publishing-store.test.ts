import { configureRecipePublishingStore } from '@application/recipes/publishing/recipe-publishing-store';
import { configureRecipeDetailStore } from '@application/recipes/detail/recipe-detail-store';
import { PublishRecipeUseCase } from '@application/recipes/publishing/publish-recipe-use-case';
import { UnpublishRecipeUseCase } from '@application/recipes/publishing/unpublish-recipe-use-case';
import { EditRecipeUseCase } from '@application/recipes/edit/edit-recipe-use-case';
import { GetRecipeUseCase } from '@application/recipes/detail/get-recipe-use-case';
import { AddRecipePhotoUseCase } from '@application/recipes/photos/add-recipe-photo-use-case';
import { RemoveRecipePhotoUseCase } from '@application/recipes/photos/remove-recipe-photo-use-case';
import { RemoveRecipeCoverUseCase } from '@application/recipes/photos/remove-recipe-cover-use-case';
import { FakeRecipeRepository } from '@application/__fixtures__/fake-recipe-repository';
import type { FakeRecipeRepositoryConfig } from '@application/__fixtures__/fake-recipe-repository-config';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import { StoreStatus } from '@application/store/store-status';
import { ConflictFailure, ErrorMessageKey } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { OwnerStatus } from '@domain/recipes/publishing/owner-status';

const RECIPE_ID = 'recipe-1';

const harness = (config: FakeRecipeRepositoryConfig = {}) => {
  const repo = new FakeRecipeRepository({ getRecipeResult: ok(recipeEntityOf()), ...config });
  const recipeDetailStore = configureRecipeDetailStore({
    getRecipe: new GetRecipeUseCase(repo),
    addRecipePhoto: new AddRecipePhotoUseCase(repo),
    removeRecipePhoto: new RemoveRecipePhotoUseCase(repo),
    removeRecipeCover: new RemoveRecipeCoverUseCase(repo),
  });
  const store = configureRecipePublishingStore({
    publishRecipe: new PublishRecipeUseCase(repo),
    unpublishRecipe: new UnpublishRecipeUseCase(repo),
    editRecipe: new EditRecipeUseCase(repo),
    recipeDetailStore,
  });
  const ownerStatus = () => {
    const entry = recipeDetailStore.getState().byId[RECIPE_ID];
    return entry?.status === StoreStatus.Loaded ? entry.recipe.ownerStatus : null;
  };
  return { repo, store, recipeDetailStore, ownerStatus };
};

describe('recipe publishing store', () => {
  it.each([
    ['approved', true, OwnerStatus.Published],
    ['pending', false, OwnerStatus.InReview],
    ['rejected', false, OwnerStatus.Rejected],
  ])('a %s answer redraws the panel as %s', async (moderationStatus, isPublished, expected) => {
    const { store, recipeDetailStore, ownerStatus } = harness({
      publishRecipeResult: ok({ isPublished, moderationStatus }),
    });
    await recipeDetailStore.getState().load(RECIPE_ID);

    const failure = await store.getState().publish(RECIPE_ID);

    expect(failure).toBeNull();
    expect(ownerStatus()).toBe(expected);
  });

  it('unpublish takes the recipe back to private', async () => {
    const { store, recipeDetailStore, ownerStatus } = harness();
    await recipeDetailStore.getState().load(RECIPE_ID);

    await store.getState().unpublish(RECIPE_ID);

    expect(ownerStatus()).toBe(OwnerStatus.Private);
  });

  it('a copyright refusal reloads the recipe so the checklist is current', async () => {
    const refusal = new ConflictFailure('blocked', undefined, ErrorMessageKey.publishBlockedCopyright);
    const { store, recipeDetailStore, repo } = harness({ publishRecipeResult: fail(refusal) });
    await recipeDetailStore.getState().load(RECIPE_ID);
    const load = jest.spyOn(repo, 'getRecipe');

    const failure = await store.getState().publish(RECIPE_ID);

    expect(failure).toBe(refusal);
    expect(load).toHaveBeenCalledWith(RECIPE_ID);
    expect(store.getState().isBusy).toBe(false);
  });

  it('an edit goes through PATCH and its answer replaces the cached recipe', async () => {
    const edited = recipeEntityOf({ name: 'Menemen, my way' });
    const { store, recipeDetailStore, repo } = harness({ updateRecipeResult: ok(edited) });
    const input = { name: { tr: 'Menemen, my way' } };

    const failure = await store.getState().edit(RECIPE_ID, input);

    expect(failure).toBeNull();
    expect(repo.lastUpdateCall).toEqual({ id: RECIPE_ID, input });
    const entry = recipeDetailStore.getState().byId[RECIPE_ID];
    expect(entry?.status === StoreStatus.Loaded ? entry.recipe.name : null).toBe('Menemen, my way');
  });
});
