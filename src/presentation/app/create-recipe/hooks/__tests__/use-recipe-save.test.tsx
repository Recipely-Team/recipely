import type { BoundStore } from '@application/store/bound-store';
/**
 * Behavior tests for `useRecipeSave` — the save-feedback rework.
 *
 * The bugs being pinned: (1) a rejected submission used to render positionally
 * (bottom caption, then a top banner) — either can sit off-screen, so it now
 * surfaces as a `saveIssue` dialog state plus inline field errors; (2) the
 * dialog copy is always localized — the backend's raw (possibly English)
 * `message` must never reach the UI, and validation failures fire no toasts;
 * (3) save first, publish later: a save is always private, opens the recipe's
 * page and says only the user can see it; editing a saved recipe goes through
 * PATCH; the assistant's publish is save, then publish.
 *
 * Harness: same as use-recipe-generation.test.tsx — the hook is driven through
 * a probe component with the REAL Zustand stores wired to `FakeRecipeRepository`,
 * exercising hook -> store -> use case -> repository end to end. `show-toast` is
 * module-mocked purely to assert it is never called from this flow again.
 */

import { useState } from 'react';
import { act } from 'react-test-renderer';
import { ErrorMessageKey, UnknownFailure, ValidationFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';
import { FakeRecipeRepository } from '@application/__fixtures__/fake-recipe-repository';
import type { FakeRecipeRepositoryConfig } from '@application/__fixtures__/fake-recipe-repository-config';
import { CreateRecipeUseCase } from '@application/recipes/create/create-recipe-use-case';
import { configureCreatedRecipesStore } from '@application/recipes/my-recipes/created-recipes-store';
import { configureDraftsStore } from '@application/drafts/drafts-store';
import type { GenerateRecipeUseCase } from '@application/recipes/generate/generate-recipe-use-case';
import type { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import type { ImportInstagramRecipeUseCase } from '@application/recipes/import/import-instagram-recipe-use-case';
import type { ListMyRecipesUseCase } from '@application/recipes/my-recipes/list-my-recipes-use-case';
import type { DeleteRecipeUseCase } from '@application/recipes/delete/delete-recipe-use-case';
import type { ListDraftsUseCase } from '@application/drafts/list/list-drafts-use-case';
import type { GetLatestDraftUseCase } from '@application/drafts/read/get-latest-draft-use-case';
import type { GetDraftUseCase } from '@application/drafts/read/get-draft-use-case';
import type { UpsertDraftUseCase } from '@application/drafts/write/upsert-draft-use-case';
import type { DeleteDraftUseCase } from '@application/drafts/write/delete-draft-use-case';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { showDangerToast, showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { useRecipeSave } from '@presentation/app/create-recipe/hooks/use-recipe-save';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';
import { NO_CREATE_RECIPE_FIELD_ERRORS } from '@presentation/app/create-recipe/model/validation/map-field-errors-to-inputs';
import type { CreateRecipeFieldErrors } from '@presentation/app/create-recipe/model/validation/create-recipe-field-errors';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { en } from '@presentation/i18n/locales/en';
import { configureRecipeDetailStore } from '@application/recipes/detail/recipe-detail-store';
import { configureRecipePublishingStore } from '@application/recipes/publishing/recipe-publishing-store';
import { GetRecipeUseCase } from '@application/recipes/detail/get-recipe-use-case';
import { AddRecipePhotoUseCase } from '@application/recipes/photos/add-recipe-photo-use-case';
import { RemoveRecipePhotoUseCase } from '@application/recipes/photos/remove-recipe-photo-use-case';
import { RemoveRecipeCoverUseCase } from '@application/recipes/photos/remove-recipe-cover-use-case';
import { PublishRecipeUseCase } from '@application/recipes/publishing/publish-recipe-use-case';
import { UnpublishRecipeUseCase } from '@application/recipes/publishing/unpublish-recipe-use-case';
import { EditRecipeUseCase } from '@application/recipes/edit/edit-recipe-use-case';
import type { RecipeListStoreState } from '@application/recipes/list/recipe-list-store-state';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';

// ─── module mocks ────────────────────────────────────────────────────────────

jest.mock('@presentation/base/feedback/show-toast', () => ({
  showDangerToast: jest.fn(),
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
  showWarningToast: jest.fn(),
}));

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: mockReplace, back: mockBack, dismissTo: mockDismissTo, canGoBack: () => true })),
}));

// ─── fixtures ────────────────────────────────────────────────────────────────

const CREATED_ID = 'r-created';
const COVER = { type: 'image', url: 'https://cdn.example.com/cover.webp' } as const;

const makeRecipe = (id: string): RecipeEntity => {
  const result = RecipeEntity.create({
    origin: RecipeOrigin.User,
    id,
    name: 'Garlic Pasta',
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    ingredients: ['pasta', 'garlic'],
    instructions: ['boil', 'toss'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 2,
    caloriesPerServing: 0,
    image: COVER.url,
    media: [COVER],
    rating: 4.5,
    tags: [],
    mealType: [],
    ownerId: 'owner-1',
    likeCount: 0,
    likedByMe: false,
    viewCount: 0,
    moderationStatus: 'approved',
    isPublished: true,
    commentCount: 0,
      sourcePlatform: null,
    aiWritten: false,
  });
  if (!result.ok) throw new Error('failed to build Recipe fixture');
  return result.value;
};

/** An editable model that passes every pre-submit guard. */
const publishable = (): EditableRecipe => ({
  ...emptyEditable(),
  name: 'Garlic Pasta',
  ingredients: ['pasta', 'garlic'],
  instructions: ['boil', 'toss'],
  media: [COVER],
});

const unusedUseCase = <T,>(): T =>
  ({ execute: () => Promise.resolve(fail(new UnknownFailure('not used'))) }) as unknown as T;

const noopCacheStore = <T,>(): T =>
  ({ getState: () => ({ replace: () => undefined, remove: () => undefined }) }) as unknown as T;

/**
 * Real createdRecipesStore + draftsStore, with create/update wired through the
 * real use cases down to a `FakeRecipeRepository` reading `config`.
 */
const makeStores = (repo: FakeRecipeRepository): Stores => {
  const recipeDetailStore = configureRecipeDetailStore({
    getRecipe: new GetRecipeUseCase(repo),
    addRecipePhoto: new AddRecipePhotoUseCase(repo),
    removeRecipePhoto: new RemoveRecipePhotoUseCase(repo),
    removeRecipeCover: new RemoveRecipeCoverUseCase(repo),
  });
  const recipePublishingStore = configureRecipePublishingStore({
    publishRecipe: new PublishRecipeUseCase(repo),
    unpublishRecipe: new UnpublishRecipeUseCase(repo),
    editRecipe: new EditRecipeUseCase(repo),
    recipeDetailStore,
  });
  const createdRecipesStore = configureCreatedRecipesStore({
    createRecipeUseCase: new CreateRecipeUseCase(repo),
    listMyRecipesUseCase: unusedUseCase<ListMyRecipesUseCase>(),
    generateRecipeUseCase: unusedUseCase<GenerateRecipeUseCase>(),
    refineRecipeUseCase: unusedUseCase<RefineRecipeUseCase>(),
    importInstagramRecipeUseCase: unusedUseCase<ImportInstagramRecipeUseCase>(),
    deleteRecipeUseCase: unusedUseCase<DeleteRecipeUseCase>(),
    recipeListStore: noopCacheStore<BoundStore<RecipeListStoreState>>(),
    recipeDetailStore,
  });

  const draftsStore = configureDraftsStore({
    listDraftsUseCase: unusedUseCase<ListDraftsUseCase>(),
    getLatestDraftUseCase: { execute: () => Promise.resolve(ok(null)) } as unknown as GetLatestDraftUseCase,
    getDraftUseCase: unusedUseCase<GetDraftUseCase>(),
    upsertDraftUseCase: unusedUseCase<UpsertDraftUseCase>(),
    // Publish success deletes the working draft as best-effort cleanup.
    deleteDraftUseCase: { execute: () => Promise.resolve(ok(undefined)) } as unknown as DeleteDraftUseCase,
  });

  return { createdRecipesStore, draftsStore, recipeDetailStore, recipePublishingStore } as unknown as Stores;
};

type Save = ReturnType<typeof useRecipeSave>;

interface HookDriver {
  repo: FakeRecipeRepository;
  latest: () => Save;
  fieldErrors: () => CreateRecipeFieldErrors;
  save: () => Promise<void>;
  saveAndPublish: () => Promise<void>;
}

/**
 * Mounts the hook behind a probe that owns the field-error state (the job
 * `useEditableRecipe` does on the real screen), so assertions can read what
 * the hook pushed into it.
 */
const driveHook = (
  config: FakeRecipeRepositoryConfig,
  recipe: EditableRecipe,
  editRecipeId?: string,
): HookDriver => {
  const repo = new FakeRecipeRepository(config);
  let latest!: Save;
  let fieldErrors: CreateRecipeFieldErrors = NO_CREATE_RECIPE_FIELD_ERRORS;

  const Probe = (): null => {
    const [errors, setErrors] = useState<CreateRecipeFieldErrors>(NO_CREATE_RECIPE_FIELD_ERRORS);
    fieldErrors = errors;
    latest = useRecipeSave({
      recipe,
      activeDraftId: 'draft-1',
      setFieldErrors: setErrors,
      editRecipeId,
    });
    return null;
  };

  renderComponent(
    <StoresProvider value={makeStores(repo)}>
      <Probe />
    </StoresProvider>,
  );

  const flush = async (run: () => void): Promise<void> => {
    await act(async () => {
      run();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };
  return {
    repo,
    latest: () => latest,
    fieldErrors: () => fieldErrors,
    save: () => flush(() => latest.onSave()),
    saveAndPublish: () => flush(() => latest.onSaveAndPublish()),
  };
};

// ─── tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useRecipeSave — pre-submit guards', () => {
  it('sets the dialog and inline field errors when name and ingredients are missing', async () => {
    const driver = driveHook({}, emptyEditable());

    await driver.save();

    expect(driver.latest().saveIssue).toBe(en.createRecipe.missing);
    expect(driver.fieldErrors().fields.name).toBe(en.createRecipe.nameRequired);
    expect(driver.fieldErrors().fields.ingredients).toBe(en.createRecipe.ingredientsRequired);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('useRecipeSave — publish', () => {
  it('saves privately, opens the recipe and says only the user can see it', async () => {
    const driver = driveHook({ createRecipeResult: ok(makeRecipe(CREATED_ID)) }, publishable());

    await driver.save();

    expect(driver.repo.lastCreateInput?.visibility).toBe('private');
    expect(mockReplace).toHaveBeenCalledWith(`/recipes/${CREATED_ID}`);
    expect(showSuccessToast).toHaveBeenCalledWith(en.createRecipe.savedPrivately);
  });

  it('labels the button Save, never Publish', () => {
    const driver = driveHook({}, publishable());

    expect(driver.latest().saveLabel).toBe(en.createRecipe.save);
  });

  it('saves an opened private recipe through PATCH instead of creating a new one', async () => {
    const driver = driveHook({ updateRecipeResult: ok(makeRecipe('r-edit')) }, publishable(), 'r-edit');

    await driver.save();

    expect(driver.repo.lastUpdateCall?.id).toBe('r-edit');
    expect(driver.repo.lastUpdateCall?.input.name).toEqual({ en: 'Garlic Pasta' });
    expect(driver.repo.lastCreateInput).toBeNull();
    // The recipe's page is still under the editor: go back to it, never stack a second copy.
    expect(mockBack).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalledWith('/recipes/r-edit');
  });

  it("the assistant's publish saves privately, then publishes", async () => {
    const publish = jest.fn();
    const driver = driveHook({ createRecipeResult: ok(makeRecipe(CREATED_ID)) }, publishable());
    jest.spyOn(driver.repo, 'publishRecipe').mockImplementation((id) => {
      publish(id);
      return Promise.resolve(ok({ isPublished: false, moderationStatus: 'pending' }));
    });

    await driver.saveAndPublish();

    expect(driver.repo.lastCreateInput?.visibility).toBe('private');
    expect(publish).toHaveBeenCalledWith(CREATED_ID);
    expect(showSuccessToast).toHaveBeenCalledWith(en.publishing.toastInReview);
  });

  it('routes a validation failure to the dialog + inline fields, never leaking raw copy', async () => {
    const failure = new ValidationFailure(
      'name: Name is too short; image: Cover image is required',
    );
    const driver = driveHook({ createRecipeResult: fail(failure) }, publishable());

    await driver.save();

    expect(driver.fieldErrors().fields.name).toBe('Name is too short');
    // The dialog shows the localized code-tier copy — the backend's raw
    // (unlocalised) sentence must not appear in it.
    expect(driver.latest().saveIssue).toBe(en.errors.validation.short);
    expect(driver.latest().saveIssue).not.toContain('Cover image');
    expect(showErrorToast).not.toHaveBeenCalled();
    expect(showDangerToast).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('prefers the dedicated key-tier copy when the failure carries a known messageKey', async () => {
    const failure = new ValidationFailure(
      'Only images (jpeg, png, gif, webp) and videos (mp4, webm, mov) are allowed',
      'image',
      ErrorMessageKey.invalidMediaType,
    );
    const driver = driveHook({ createRecipeResult: fail(failure) }, publishable());

    await driver.save();

    expect(driver.latest().saveIssue).toBe(en.errors.invalidMediaType.short);
  });
});
