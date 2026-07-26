import { configureCreatedRecipesStore } from '@application/recipes/my-recipes/configure-created-recipes-store';
import type { CreateRecipeUseCase } from '@application/recipes/create/create-recipe-use-case';
import type { GenerateRecipeUseCase } from '@application/recipes/generate/generate-recipe-use-case';
import type { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import type { ImportInstagramRecipeUseCase } from '@application/recipes/import/import-instagram-recipe-use-case';
import type { ImportInstagramRecipeInput } from '@application/recipes/import/import-instagram-recipe-input';
import type { ListMyRecipesUseCase } from '@application/recipes/my-recipes/list-my-recipes-use-case';
import type { UpdateRecipeUseCase } from '@application/recipes/update/update-recipe-use-case';
import type { DeleteRecipeUseCase } from '@application/recipes/delete/delete-recipe-use-case';
import type { RecipeListStore } from '@application/recipes/list/recipe-list-store';
import type { RecipeDetailStore } from '@application/recipes/detail/recipe-detail-store';
import { UnknownFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const makeRecipe = (overrides: Partial<Parameters<typeof RecipeEntity.create>[0]> = {}): RecipeEntity => {
  const result = RecipeEntity.create({
    id: 'r1',
    name: 'Imported Recipe',
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    ingredients: ['flour'],
    instructions: ['mix'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 2,
    caloriesPerServing: 0,
    image: 'https://cdn.example.com/r1.webp',
    media: [{ type: 'image', url: 'https://cdn.example.com/r1.webp' }],
    rating: 4.5,
    tags: [],
    mealType: [],
    ownerId: 'owner-1',
    likeCount: 0,
    likedByMe: false,
    viewCount: 0,
    moderationStatus: 'approved',
    commentCount: 0,
    ...overrides,
  });
  if (!result.ok) throw new Error('failed to build Recipe fixture');
  return result.value;
};

// Hand-rolled fakes — we only exercise importInstagram in this file, but the
// store requires all use cases at construction time.
const fakeCreateUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
} as unknown as CreateRecipeUseCase;

const fakeListMyUseCase = {
  execute: () => Promise.resolve(ok([])),
} as unknown as ListMyRecipesUseCase;

const fakeUpdateUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
} as unknown as UpdateRecipeUseCase;

const fakeDeleteUseCase = {
  execute: () => Promise.resolve(ok(undefined)),
} as unknown as DeleteRecipeUseCase;

const fakeGenerateUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
} as unknown as GenerateRecipeUseCase;

const fakeRefineUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
} as unknown as RefineRecipeUseCase;

const fakeRecipeListStore = {
  getState: () => ({ replace: () => undefined, remove: () => undefined }),
} as unknown as RecipeListStore;

const fakeRecipeDetailStore = {
  getState: () => ({ replace: () => undefined, remove: () => undefined }),
} as unknown as RecipeDetailStore;

interface DeferredImportUseCase {
  useCase: ImportInstagramRecipeUseCase;
  resolve: (r: Result<RecipeEntity, Failure>) => void;
  lastInput: ImportInstagramRecipeInput | null;
}

// Returns a use case whose `execute` returns a promise the test controls.
const makeDeferredImportUseCase = (): DeferredImportUseCase => {
  let resolveFn: (r: Result<RecipeEntity, Failure>) => void = () => undefined;
  const promise = new Promise<Result<RecipeEntity, Failure>>((res) => {
    resolveFn = res;
  });
  const ref: DeferredImportUseCase = {
    useCase: {
      execute: (input: ImportInstagramRecipeInput) => {
        ref.lastInput = input;
        return promise;
      },
    } as unknown as ImportInstagramRecipeUseCase,
    resolve: (r) => resolveFn(r),
    lastInput: null,
  };
  return ref;
};

const makeStoreWithImportUseCase = (importUseCase: ImportInstagramRecipeUseCase) =>
  configureCreatedRecipesStore({
    createRecipeUseCase: fakeCreateUseCase,
    listMyRecipesUseCase: fakeListMyUseCase,
    generateRecipeUseCase: fakeGenerateUseCase,
    refineRecipeUseCase: fakeRefineUseCase,
    importInstagramRecipeUseCase: importUseCase,
    updateRecipeUseCase: fakeUpdateUseCase,
    deleteRecipeUseCase: fakeDeleteUseCase,
    recipeListStore: fakeRecipeListStore,
    recipeDetailStore: fakeRecipeDetailStore,
  });

const makeStoreWithImportResult = (result: Result<RecipeEntity, Failure>) =>
  makeStoreWithImportUseCase({
    execute: (_input: ImportInstagramRecipeInput) => Promise.resolve(result),
  } as unknown as ImportInstagramRecipeUseCase);

describe('createdRecipesStore.importInstagram', () => {
  it('starts with importState idle and aiDraft null', () => {
    const store = makeStoreWithImportResult(ok(makeRecipe()));

    expect(store.getState().importState).toEqual({ status: 'idle' });
    expect(store.getState().aiDraft).toBeNull();
    expect(store.getState().recipes).toEqual([]);
  });

  it('transitions to generating synchronously before the promise resolves', async () => {
    const deferred = makeDeferredImportUseCase();
    const store = makeStoreWithImportUseCase(deferred.useCase);

    const pending = store.getState().importInstagram('https://www.instagram.com/reel/abc/');

    // Synchronous check — state must have flipped before we await.
    expect(store.getState().importState).toEqual({ status: 'generating' });
    expect(store.getState().aiDraft).toBeNull();
    expect(deferred.lastInput).toEqual({
      url: 'https://www.instagram.com/reel/abc/',
    });

    deferred.resolve(ok(makeRecipe()));
    await pending;
  });

  it('on success, sets importState.success and aiDraft, but does NOT prepend the preview to recipes', async () => {
    const recipe = makeRecipe({ id: 'r-import', name: 'Imported Dish' });
    const store = makeStoreWithImportResult(ok(recipe));

    await store.getState().importInstagram('https://www.instagram.com/reel/abc/');

    const s = store.getState();
    expect(s.importState.status).toBe('success');
    if (s.importState.status === 'success') {
      expect(s.importState.recipe).toBe(recipe);
    }
    expect(s.aiDraft).toBe(recipe);
    // WHY: `/recipes/import` returns a NOT-persisted preview with a throwaway id.
    // Prepending it to `recipes` would show a phantom "My Recipes" entry.
    expect(s.recipes).toEqual([]);
  });

  it('leaves existing recipes untouched when a reel is imported', async () => {
    const existing = makeRecipe({ id: 'existing' });
    const imported = makeRecipe({ id: 'imported' });
    const store = makeStoreWithImportResult(ok(imported));
    store.getState().add(existing);

    await store.getState().importInstagram('https://instagram.com/p/xyz');

    const s = store.getState();
    expect(s.recipes.map((r) => r.id)).toEqual(['existing']);
    expect(s.aiDraft).toBe(imported);
  });

  it('on failure, sets importState.error and leaves aiDraft + recipes untouched', async () => {
    const failure = new UnknownFailure('import down');
    const store = makeStoreWithImportResult(fail(failure));

    await store.getState().importInstagram('https://www.instagram.com/reel/abc/');

    const s = store.getState();
    expect(s.importState.status).toBe('error');
    if (s.importState.status === 'error') {
      expect(s.importState.failure).toBe(failure);
    }
    expect(s.aiDraft).toBeNull();
    expect(s.recipes).toEqual([]);
  });

  it('resetImportState returns importState to idle', async () => {
    const store = makeStoreWithImportResult(ok(makeRecipe()));

    await store.getState().importInstagram('https://www.instagram.com/reel/abc/');
    expect(store.getState().importState.status).toBe('success');

    store.getState().resetImportState();

    expect(store.getState().importState).toEqual({ status: 'idle' });
  });
});
