/**
 * The symptom: closing the editor on a saved private recipe dropped every
 * unsaved edit without a word — the edit mode skipped the exit question.
 *
 * Leaving with changes now asks (save through PATCH, or discard the changes);
 * leaving with nothing changed just goes. Discarding touches no draft: an edit
 * of a saved recipe has none.
 */

import { useState } from 'react';
import { act } from 'react-test-renderer';
import { UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { BoundStore } from '@application/store/bound-store';
import { FakeRecipeRepository } from '@application/__fixtures__/fake-recipe-repository';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import { configureRecipeDetailStore } from '@application/recipes/detail/recipe-detail-store';
import { GetRecipeUseCase } from '@application/recipes/detail/get-recipe-use-case';
import { AddRecipePhotoUseCase } from '@application/recipes/photos/add-recipe-photo-use-case';
import { RemoveRecipePhotoUseCase } from '@application/recipes/photos/remove-recipe-photo-use-case';
import { RemoveRecipeCoverUseCase } from '@application/recipes/photos/remove-recipe-cover-use-case';
import { configureCreatedRecipesStore } from '@application/recipes/my-recipes/created-recipes-store';
import { configureDraftsStore } from '@application/drafts/drafts-store';
import type { RecipeListStoreState } from '@application/recipes/list/recipe-list-store-state';
import type { Stores } from '@presentation/bootstrap/stores';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useRecipeGeneration } from '@presentation/app/create-recipe/hooks/use-recipe-generation';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { PhaseType } from '@presentation/app/create-recipe/model/phase-type';

jest.mock('@presentation/base/feedback/show-toast', () => ({
  showDangerToast: jest.fn(),
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));

const mockRouter = { replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => mockRouter),
  useLocalSearchParams: jest.fn(() => ({})),
}));

const RECIPE_ID = 'recipe-1';

// Covers every use case the two stores need but these tests never reach.
const unused = <T,>(): T =>
  ({ execute: () => Promise.resolve(fail(new UnknownFailure('not used'))) }) as unknown as T;

const mount = () => {
  const repo = new FakeRecipeRepository({ getRecipeResult: ok(recipeEntityOf({ id: RECIPE_ID })) });
  const recipeDetailStore = configureRecipeDetailStore({
    getRecipe: new GetRecipeUseCase(repo),
    addRecipePhoto: new AddRecipePhotoUseCase(repo),
    removeRecipePhoto: new RemoveRecipePhotoUseCase(repo),
    removeRecipeCover: new RemoveRecipeCoverUseCase(repo),
  });
  const deleteDraft = jest.fn(() => Promise.resolve(ok(undefined)));
  const draftsStore = configureDraftsStore({
    listDraftsUseCase: unused(),
    getLatestDraftUseCase: unused(),
    getDraftUseCase: unused(),
    upsertDraftUseCase: unused(),
    deleteDraftUseCase: { execute: deleteDraft } as never,
  });
  const createdRecipesStore = configureCreatedRecipesStore({
    createRecipeUseCase: unused(),
    listMyRecipesUseCase: unused(),
    generateRecipeUseCase: unused(),
    importInstagramRecipeUseCase: unused(),
    refineRecipeUseCase: unused(),
    deleteRecipeUseCase: unused(),
    recipeListStore: unused<BoundStore<RecipeListStoreState>>(),
    recipeDetailStore,
  });
  const stores = { recipeDetailStore, draftsStore, createdRecipesStore } as unknown as Stores;

  let latest!: ReturnType<typeof useRecipeGeneration>;
  let setRecipe!: (update: (prev: EditableRecipe) => EditableRecipe) => void;
  const Probe = (): null => {
    const [recipe, set] = useState<EditableRecipe>(emptyEditable());
    setRecipe = set;
    latest = useRecipeGeneration({
      recipe,
      setRecipe: set,
      activeDraftId: 'new-draft',
      draftId: undefined,
      editRecipeId: RECIPE_ID,
    });
    return null;
  };
  renderComponent(
    <StoresProvider value={stores}>
      <Probe />
    </StoresProvider>,
  );
  return { latest: () => latest, edit: setRecipe, deleteDraft };
};

const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

beforeEach(() => jest.clearAllMocks());

describe('editing a saved recipe — leaving', () => {
  it('leaves without asking when nothing changed', async () => {
    const hook = mount();
    await settle();
    expect(hook.latest().phase).toBe(PhaseType.Preview);

    let asked = true;
    act(() => {
      asked = hook.latest().onClose();
    });

    expect(asked).toBe(false);
    expect(hook.latest().exitOpen).toBe(false);
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('asks before dropping changes, and discarding leaves without touching drafts', async () => {
    const hook = mount();
    await settle();
    act(() => hook.edit((prev) => ({ ...prev, name: 'Menemen, my way' })));

    let asked = false;
    act(() => {
      asked = hook.latest().onClose();
    });

    expect(asked).toBe(true);
    expect(hook.latest().exitOpen).toBe(true);
    expect(mockRouter.back).not.toHaveBeenCalled();

    await act(async () => hook.latest().onDiscardAndExit());
    await settle();

    expect(mockRouter.back).toHaveBeenCalled();
    expect(hook.deleteDraft).not.toHaveBeenCalled();
  });
});
