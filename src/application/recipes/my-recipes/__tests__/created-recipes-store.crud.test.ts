import type { BoundStore } from '@application/store/bound-store';
import { configureCreatedRecipesStore } from '@application/recipes/my-recipes/created-recipes-store';
import type { CreateRecipeUseCase } from '@application/recipes/create/create-recipe-use-case';
import type { GenerateRecipeUseCase } from '@application/recipes/generate/generate-recipe-use-case';
import type { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import type { ImportInstagramRecipeUseCase } from '@application/recipes/import/import-instagram-recipe-use-case';
import type { ListMyRecipesUseCase } from '@application/recipes/my-recipes/list-my-recipes-use-case';
import type { DeleteRecipeUseCase } from '@application/recipes/delete/delete-recipe-use-case';
import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import { UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';
import type { RecipeDetailStoreState } from '@application/recipes/detail/recipe-detail-store-state';
import type { RecipeListStoreState } from '@application/recipes/list/recipe-list-store-state';
import { recipePageOf } from '@application/__fixtures__/recipe-page-of';

const makeRecipe = (overrides: Partial<Parameters<typeof RecipeEntity.create>[0]> = {}): RecipeEntity => {
  const result = RecipeEntity.create({
    id: 'r1',
    name: 'My Recipe',
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

const makeSummary = (overrides: Partial<Parameters<typeof RecipeSummaryEntity.create>[0]> = {}): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    id: 'network-only',
    name: 'Network Only Recipe',
    image: 'https://cdn.example.com/network.webp',
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    totalTimeMinutes: 30,
    rating: 4.0,
    moderationStatus: 'approved',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    viewCount: 0,
    ...overrides,
  });
  if (!result.ok) throw new Error('failed to build RecipeSummaryEntity fixture');
  return result.value;
};

const createInput: CreateRecipeInput = {
  name: { en: 'New Recipe' },
  cuisine: CuisineKey.Italian,
  category: RecipeCategory.Dinner,
  difficulty: Difficulty.Easy,
  ingredients: { en: ['flour'] },
  instructions: { en: ['mix'] },
  prepTimeMinutes: 5,
  cookTimeMinutes: 10,
  servings: 2,
  media: [],
};

// Hand-rolled fakes — construction requires all use cases, but each test only
// exercises the one(s) relevant to its scenario.
const fakeGenerateUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
} as unknown as GenerateRecipeUseCase;

const fakeImportUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
} as unknown as ImportInstagramRecipeUseCase;

const fakeRefineUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
} as unknown as RefineRecipeUseCase;

interface Deps {
  createRecipeUseCase: CreateRecipeUseCase;
  listMyRecipesUseCase: ListMyRecipesUseCase;
  deleteRecipeUseCase: DeleteRecipeUseCase;
  recipeListStore: BoundStore<RecipeListStoreState>;
  recipeDetailStore: BoundStore<RecipeDetailStoreState>;
}

const makeStore = (overrides: Partial<Deps> = {}) => {
  const fakeCreateUseCase = {
    execute: () => Promise.resolve(fail(new UnknownFailure('not used'))),
  } as unknown as CreateRecipeUseCase;

  const fakeListMyUseCase = {
    execute: () => Promise.resolve(ok([])),
  } as unknown as ListMyRecipesUseCase;

  const fakeDeleteUseCase = {
    execute: () => Promise.resolve(ok(undefined)),
  } as unknown as DeleteRecipeUseCase;

  const recipeListStoreReplace = jest.fn();
  const recipeListStoreRemove = jest.fn();
  const fakeRecipeListStore = {
    getState: () => ({ replace: recipeListStoreReplace, remove: recipeListStoreRemove }),
  } as unknown as BoundStore<RecipeListStoreState>;

  const recipeDetailStoreReplace = jest.fn();
  const recipeDetailStoreRemove = jest.fn();
  const fakeRecipeDetailStore = {
    getState: () => ({ replace: recipeDetailStoreReplace, remove: recipeDetailStoreRemove }),
  } as unknown as BoundStore<RecipeDetailStoreState>;

  const store = configureCreatedRecipesStore({
    createRecipeUseCase: fakeCreateUseCase,
    listMyRecipesUseCase: fakeListMyUseCase,
    generateRecipeUseCase: fakeGenerateUseCase,
    importInstagramRecipeUseCase: fakeImportUseCase,
    refineRecipeUseCase: fakeRefineUseCase,
    deleteRecipeUseCase: fakeDeleteUseCase,
    recipeListStore: fakeRecipeListStore,
    recipeDetailStore: fakeRecipeDetailStore,
    ...overrides,
  });

  return { store, recipeListStoreReplace, recipeListStoreRemove, recipeDetailStoreReplace, recipeDetailStoreRemove };
};

describe('createdRecipesStore CRUD', () => {
  describe('add', () => {
    it('prepends the full Recipe to localRecipes and a lean RecipeSummaryEntity to recipes', () => {
      const { store } = makeStore();
      const recipe = makeRecipe({ id: 'r-added', name: 'Added Recipe' });

      store.getState().add(recipe);

      const s = store.getState();
      expect(s.localRecipes[0]).toBe(recipe);
      expect(s.recipes[0].id).toBe('r-added');
      expect(s.recipes[0].name).toBe('Added Recipe');
      expect(s.recipes[0]).toBeInstanceOf(RecipeSummaryEntity);
    });
  });

  describe('remove', () => {
    it('removes the matching entry from both arrays', () => {
      const { store } = makeStore();
      const kept = makeRecipe({ id: 'r-kept' });
      const removed = makeRecipe({ id: 'r-removed' });
      store.getState().add(kept);
      store.getState().add(removed);

      store.getState().remove('r-removed');

      const s = store.getState();
      expect(s.localRecipes.map((r) => r.id)).toEqual(['r-kept']);
      expect(s.recipes.map((r) => r.id)).toEqual(['r-kept']);
    });
  });

  describe('findById', () => {
    it('reads from localRecipes, not from recipes', async () => {
      const listMyRecipesUseCase = {
        execute: () => Promise.resolve(ok(recipePageOf([makeSummary({ id: 'network-only' })]))),
      } as unknown as ListMyRecipesUseCase;
      const { store } = makeStore({ listMyRecipesUseCase });
      await store.getState().loadMyRecipes();
      const localOnly = makeRecipe({ id: 'local-only' });
      store.getState().add(localOnly);

      const s = store.getState();
      expect(s.recipes.map((r) => r.id)).toContain('network-only');
      expect(s.findById('network-only')).toBeUndefined();
      expect(s.findById('local-only')).toBe(localOnly);
    });
  });

  describe('createRecipe', () => {
    it('on success, adds the new recipe to both recipes and localRecipes via the store\'s own add logic', async () => {
      const createRecipeUseCase = {
        execute: () => Promise.resolve(ok(makeRecipe({ id: 'r-created', name: 'Created Recipe' }))),
      } as unknown as CreateRecipeUseCase;
      const { store } = makeStore({ createRecipeUseCase });

      await store.getState().createRecipe(createInput);

      const s = store.getState();
      expect(s.createState.status).toBe('success');
      expect(s.localRecipes.map((r) => r.id)).toEqual(['r-created']);
      expect(s.recipes.map((r) => r.id)).toEqual(['r-created']);
    });

    it('on failure, sets createState.error and leaves recipes/localRecipes untouched', async () => {
      const failure = new UnknownFailure('boom');
      const createRecipeUseCase = {
        execute: () => Promise.resolve(fail(failure)),
      } as unknown as CreateRecipeUseCase;
      const { store } = makeStore({ createRecipeUseCase });

      await store.getState().createRecipe(createInput);

      const s = store.getState();
      expect(s.createState).toEqual({ status: 'error', failure });
      expect(s.localRecipes).toEqual([]);
      expect(s.recipes).toEqual([]);
    });
  });

  describe('deleteRecipe', () => {
    it('on success, removes from both arrays and notifies sibling stores', async () => {
      const { store, recipeListStoreRemove, recipeDetailStoreRemove } = makeStore();
      const recipe = makeRecipe({ id: 'r-to-delete' });
      store.getState().add(recipe);

      await store.getState().deleteRecipe('r-to-delete');

      const s = store.getState();
      expect(s.localRecipes).toEqual([]);
      expect(s.recipes).toEqual([]);
      expect(s.deleteState).toEqual({ status: 'success' });
      expect(recipeListStoreRemove).toHaveBeenCalledWith('r-to-delete');
      expect(recipeDetailStoreRemove).toHaveBeenCalledWith('r-to-delete');
    });

    it('on failure, sets deleteState.error and does not touch sibling stores', async () => {
      const failure = new UnknownFailure('cannot delete');
      const deleteRecipeUseCase = {
        execute: () => Promise.resolve(fail(failure)),
      } as unknown as DeleteRecipeUseCase;
      const { store, recipeListStoreRemove, recipeDetailStoreRemove } = makeStore({ deleteRecipeUseCase });
      const recipe = makeRecipe({ id: 'r-stays' });
      store.getState().add(recipe);

      await store.getState().deleteRecipe('r-stays');

      const s = store.getState();
      expect(s.deleteState).toEqual({ status: 'error', failure });
      expect(s.localRecipes.map((r) => r.id)).toEqual(['r-stays']);
      expect(recipeListStoreRemove).not.toHaveBeenCalled();
      expect(recipeDetailStoreRemove).not.toHaveBeenCalled();
    });
  });

  describe('loadMyRecipes', () => {
    it('sets recipes from the lean use case result and leaves localRecipes untouched', async () => {
      const localRecipe = makeRecipe({ id: 'local-survivor' });
      const listMyRecipesUseCase = {
        execute: () => Promise.resolve(ok(recipePageOf([makeSummary({ id: 'r-from-network' })]))),
      } as unknown as ListMyRecipesUseCase;
      const { store } = makeStore({ listMyRecipesUseCase });
      store.getState().add(localRecipe);

      await store.getState().loadMyRecipes();

      const s = store.getState();
      expect(s.recipes.map((r) => r.id)).toEqual(['r-from-network']);
      expect(s.localRecipes).toContain(localRecipe);
    });

    it('leaves recipes untouched on failure', async () => {
      const existing = makeSummary({ id: 'kept' });
      let callCount = 0;
      const listMyRecipesUseCase = {
        execute: () => {
          callCount += 1;
          return Promise.resolve(callCount === 1 ? ok(recipePageOf([existing])) : fail(new UnknownFailure('down')));
        },
      } as unknown as ListMyRecipesUseCase;
      const { store } = makeStore({ listMyRecipesUseCase });
      await store.getState().loadMyRecipes();
      expect(store.getState().recipes.map((r) => r.id)).toEqual(['kept']);

      await store.getState().loadMyRecipes();

      expect(store.getState().recipes.map((r) => r.id)).toEqual(['kept']);
    });
  });
});
