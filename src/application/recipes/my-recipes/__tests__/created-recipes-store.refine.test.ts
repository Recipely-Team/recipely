import { configureCreatedRecipesStore } from '@application/recipes/my-recipes/configure-created-recipes-store';
import type { CreateRecipeUseCase } from '@application/recipes/create/create-recipe-use-case';
import type { GenerateRecipeUseCase } from '@application/recipes/generate/generate-recipe-use-case';
import type { ImportInstagramRecipeUseCase } from '@application/recipes/import/import-instagram-recipe-use-case';
import type { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import type { RefineRecipeInput } from '@application/recipes/refine/refine-recipe-input';
import type { ListMyRecipesUseCase } from '@application/recipes/my-recipes/list-my-recipes-use-case';
import type { UpdateRecipeUseCase } from '@application/recipes/update/update-recipe-use-case';
import type { DeleteRecipeUseCase } from '@application/recipes/delete/delete-recipe-use-case';
import type { RecipeListStore } from '@application/recipes/list/recipe-list-store';
import type { RecipeDetailStore } from '@application/recipes/detail/recipe-detail-store';
import { UnknownFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RefinedRecipe } from '@domain/recipes/refine/refined-recipe';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const snapshot: DraftRecipeSnapshot = { name: 'Spicy Pasta', ingredients: ['Pasta'] };

const makeRecipe = (overrides: Partial<Parameters<typeof RecipeEntity.create>[0]> = {}): RecipeEntity => {
  const result = RecipeEntity.create({
    id: 'r1',
    name: 'Refined Recipe',
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

const fakeCreateUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
} as unknown as CreateRecipeUseCase;

const fakeListMyUseCase = {
  execute: () => Promise.resolve(ok([])),
} as unknown as ListMyRecipesUseCase;

const fakeGenerateUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
} as unknown as GenerateRecipeUseCase;

const fakeImportUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
} as unknown as ImportInstagramRecipeUseCase;

const fakeUpdateUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
} as unknown as UpdateRecipeUseCase;

const fakeDeleteUseCase = {
  execute: () => Promise.resolve(ok(undefined)),
} as unknown as DeleteRecipeUseCase;

const fakeRecipeListStore = {
  getState: () => ({ replace: () => undefined, remove: () => undefined }),
} as unknown as RecipeListStore;

const fakeRecipeDetailStore = {
  getState: () => ({ replace: () => undefined, remove: () => undefined }),
} as unknown as RecipeDetailStore;

interface DeferredRefineUseCase {
  useCase: RefineRecipeUseCase;
  resolve: (r: Result<RefinedRecipe, Failure>) => void;
  lastInput: RefineRecipeInput | null;
}

const makeDeferredRefineUseCase = (): DeferredRefineUseCase => {
  let resolveFn: (r: Result<RefinedRecipe, Failure>) => void = () => undefined;
  const promise = new Promise<Result<RefinedRecipe, Failure>>((res) => {
    resolveFn = res;
  });
  const ref: DeferredRefineUseCase = {
    useCase: {
      execute: (input: RefineRecipeInput) => {
        ref.lastInput = input;
        return promise;
      },
    } as unknown as RefineRecipeUseCase,
    resolve: (r) => resolveFn(r),
    lastInput: null,
  };
  return ref;
};

const makeStoreWithRefineResult = (result: Result<RefinedRecipe, Failure>) => {
  const refineUseCase = {
    execute: (_input: RefineRecipeInput) => Promise.resolve(result),
  } as unknown as RefineRecipeUseCase;

  return configureCreatedRecipesStore({
    createRecipeUseCase: fakeCreateUseCase,
    listMyRecipesUseCase: fakeListMyUseCase,
    generateRecipeUseCase: fakeGenerateUseCase,
    importInstagramRecipeUseCase: fakeImportUseCase,
    refineRecipeUseCase: refineUseCase,
    updateRecipeUseCase: fakeUpdateUseCase,
    deleteRecipeUseCase: fakeDeleteUseCase,
    recipeListStore: fakeRecipeListStore,
    recipeDetailStore: fakeRecipeDetailStore,
  });
};

describe('createdRecipesStore.refineRecipe', () => {
  it('starts with refineState idle', () => {
    const store = makeStoreWithRefineResult(ok({ recipe: makeRecipe() }));

    expect(store.getState().refineState).toEqual({ status: 'idle' });
  });

  it('transitions to refining synchronously before the promise resolves', async () => {
    const deferred = makeDeferredRefineUseCase();
    const store = configureCreatedRecipesStore({
      createRecipeUseCase: fakeCreateUseCase,
      listMyRecipesUseCase: fakeListMyUseCase,
      generateRecipeUseCase: fakeGenerateUseCase,
      importInstagramRecipeUseCase: fakeImportUseCase,
      refineRecipeUseCase: deferred.useCase,
      updateRecipeUseCase: fakeUpdateUseCase,
      deleteRecipeUseCase: fakeDeleteUseCase,
      recipeListStore: fakeRecipeListStore,
      recipeDetailStore: fakeRecipeDetailStore,
    });

    const pending = store.getState().refineRecipe(snapshot, 'add garlic');

    expect(store.getState().refineState).toEqual({ status: 'refining' });

    deferred.resolve(ok({ recipe: makeRecipe() }));
    await pending;
  });

  it('on success sets refineState.success from refined.recipe, returns the RefinedRecipe, and does NOT add it to recipes', async () => {
    const recipe = makeRecipe({ id: 'r-refined' });
    const refined: RefinedRecipe = { recipe, summary: 'Added garlic.', suggestion: 'Try basil.' };
    const store = makeStoreWithRefineResult(ok(refined));

    const returned = await store.getState().refineRecipe(snapshot, 'add garlic');

    const s = store.getState();
    expect(s.refineState.status).toBe('success');
    if (s.refineState.status === 'success') {
      expect(s.refineState.recipe).toBe(recipe);
    }
    expect(returned).toBe(refined);
    // WHY: refine returns a NOT-persisted preview; prepending it to `recipes`
    // would surface a phantom "My Recipes" entry that does not exist on the server.
    expect(s.recipes).toEqual([]);
  });

  it('leaves existing recipes untouched when a recipe is refined', async () => {
    const existing = makeRecipe({ id: 'existing' });
    const refined = makeRecipe({ id: 'refined' });
    const store = makeStoreWithRefineResult(ok({ recipe: refined }));
    store.getState().add(existing);

    await store.getState().refineRecipe(snapshot, 'add garlic');

    expect(store.getState().recipes.map((r) => r.id)).toEqual(['existing']);
  });

  it('on failure sets refineState.error and returns null', async () => {
    const failure = new UnknownFailure('AI down');
    const store = makeStoreWithRefineResult(fail(failure));

    const returned = await store.getState().refineRecipe(snapshot, 'add garlic');

    const s = store.getState();
    expect(s.refineState.status).toBe('error');
    if (s.refineState.status === 'error') {
      expect(s.refineState.failure).toBe(failure);
    }
    expect(returned).toBeNull();
    expect(s.recipes).toEqual([]);
  });

  it('resetRefineState returns refineState to idle', async () => {
    const store = makeStoreWithRefineResult(ok({ recipe: makeRecipe() }));

    await store.getState().refineRecipe(snapshot, 'add garlic');
    expect(store.getState().refineState.status).toBe('success');

    store.getState().resetRefineState();

    expect(store.getState().refineState).toEqual({ status: 'idle' });
  });
});
