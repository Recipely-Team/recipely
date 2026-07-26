import { configureCreatedRecipesStore } from '@application/recipes/my-recipes/configure-created-recipes-store';
import type {
  CreateRecipeUseCase,
} from '@application/recipes/create/create-recipe-use-case';
import type { GenerateRecipeUseCase } from '@application/recipes/generate/generate-recipe-use-case';
import type { GenerateRecipeInput } from '@application/recipes/generate/generate-recipe-input';
import type { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import type { ImportInstagramRecipeUseCase } from '@application/recipes/import/import-instagram-recipe-use-case';
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
    name: 'AI Recipe',
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

// Hand-rolled fakes — we only exercise generateRecipe in this file, but the
// store requires all five use cases at construction time.
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

const fakeRefineUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
} as unknown as RefineRecipeUseCase;

const fakeImportUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
} as unknown as ImportInstagramRecipeUseCase;

// Generate flow never touches these — provide no-op stubs that satisfy the
// interface so the store constructs without exercising the sibling caches.
const fakeRecipeListStore = {
  getState: () => ({ replace: () => undefined, remove: () => undefined }),
} as unknown as RecipeListStore;

const fakeRecipeDetailStore = {
  getState: () => ({ replace: () => undefined, remove: () => undefined }),
} as unknown as RecipeDetailStore;

interface DeferredGenerateUseCase {
  useCase: GenerateRecipeUseCase;
  resolve: (r: Result<RecipeEntity, Failure>) => void;
  lastInput: GenerateRecipeInput | null;
}

// Returns a use case whose `execute` returns a promise the test controls.
const makeDeferredGenerateUseCase = (): DeferredGenerateUseCase => {
  let resolveFn: (r: Result<RecipeEntity, Failure>) => void = () => undefined;
  const promise = new Promise<Result<RecipeEntity, Failure>>((res) => {
    resolveFn = res;
  });
  const ref: DeferredGenerateUseCase = {
    useCase: {
      execute: (input: GenerateRecipeInput) => {
        ref.lastInput = input;
        return promise;
      },
    } as unknown as GenerateRecipeUseCase,
    resolve: (r) => resolveFn(r),
    lastInput: null,
  };
  return ref;
};

const makeStoreWithGenerateResult = (result: Result<RecipeEntity, Failure>) => {
  const generateUseCase = {
    execute: (_input: GenerateRecipeInput) => Promise.resolve(result),
  } as unknown as GenerateRecipeUseCase;

  return configureCreatedRecipesStore({
    createRecipeUseCase: fakeCreateUseCase,
    listMyRecipesUseCase: fakeListMyUseCase,
    generateRecipeUseCase: generateUseCase,
    refineRecipeUseCase: fakeRefineUseCase,
    importInstagramRecipeUseCase: fakeImportUseCase,
    updateRecipeUseCase: fakeUpdateUseCase,
    deleteRecipeUseCase: fakeDeleteUseCase,
    recipeListStore: fakeRecipeListStore,
    recipeDetailStore: fakeRecipeDetailStore,
  });
};

describe('createdRecipesStore.generateRecipe', () => {
  it('starts with generateState idle and aiDraft null', () => {
    const store = makeStoreWithGenerateResult(ok(makeRecipe()));

    expect(store.getState().generateState).toEqual({ status: 'idle' });
    expect(store.getState().aiDraft).toBeNull();
    expect(store.getState().recipes).toEqual([]);
  });

  it('transitions to generating synchronously before the promise resolves', async () => {
    const deferred = makeDeferredGenerateUseCase();
    const store = configureCreatedRecipesStore({
      createRecipeUseCase: fakeCreateUseCase,
      listMyRecipesUseCase: fakeListMyUseCase,
      generateRecipeUseCase: deferred.useCase,
      refineRecipeUseCase: fakeRefineUseCase,
      importInstagramRecipeUseCase: fakeImportUseCase,
      updateRecipeUseCase: fakeUpdateUseCase,
      deleteRecipeUseCase: fakeDeleteUseCase,
      recipeListStore: fakeRecipeListStore,
      recipeDetailStore: fakeRecipeDetailStore,
    });

    const pending = store.getState().generateRecipe('pasta');

    // Synchronous check — state must have flipped before we await.
    expect(store.getState().generateState).toEqual({ status: 'generating' });
    expect(store.getState().aiDraft).toBeNull();

    deferred.resolve(ok(makeRecipe()));
    await pending;
  });

  it('on success, sets generateState.success and aiDraft, but does NOT touch recipes', async () => {
    const recipe = makeRecipe({ id: 'r-new', name: 'New AI Dish' });
    const store = makeStoreWithGenerateResult(ok(recipe));

    await store.getState().generateRecipe('pasta');

    const s = store.getState();
    expect(s.generateState.status).toBe('success');
    if (s.generateState.status === 'success') {
      expect(s.generateState.recipe).toBe(recipe);
    }
    expect(s.aiDraft).toBe(recipe);
    // WHY: `/recipes/generate` does not persist the recipe — it returns a
    // preview with a throwaway id. Prepending it to `recipes` would show a
    // phantom entry in "My Recipes" that does not exist on the server.
    expect(s.recipes).toEqual([]);
  });

  it('leaves existing recipes untouched when a recipe is generated', async () => {
    const existing = makeRecipe({ id: 'existing' });
    const generated = makeRecipe({ id: 'generated' });
    const store = makeStoreWithGenerateResult(ok(generated));
    store.getState().add(existing);

    await store.getState().generateRecipe('pasta');

    const s = store.getState();
    expect(s.recipes.map((r) => r.id)).toEqual(['existing']);
    expect(s.aiDraft).toBe(generated);
  });

  it('on failure, sets generateState.error and leaves aiDraft + recipes untouched', async () => {
    const failure = new UnknownFailure('AI down');
    const store = makeStoreWithGenerateResult(fail(failure));

    await store.getState().generateRecipe('pasta');

    const s = store.getState();
    expect(s.generateState.status).toBe('error');
    if (s.generateState.status === 'error') {
      expect(s.generateState.failure).toBe(failure);
    }
    expect(s.aiDraft).toBeNull();
    expect(s.recipes).toEqual([]);
  });

  it('resetGenerateState returns generateState to idle', async () => {
    const store = makeStoreWithGenerateResult(ok(makeRecipe()));

    await store.getState().generateRecipe('pasta');
    expect(store.getState().generateState.status).toBe('success');

    store.getState().resetGenerateState();

    expect(store.getState().generateState).toEqual({ status: 'idle' });
  });

  it('clearAiDraft sets aiDraft back to null', async () => {
    const recipe = makeRecipe();
    const store = makeStoreWithGenerateResult(ok(recipe));

    await store.getState().generateRecipe('pasta');
    expect(store.getState().aiDraft).toBe(recipe);

    store.getState().clearAiDraft();

    expect(store.getState().aiDraft).toBeNull();
  });
});
