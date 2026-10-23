import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';
import type { CreateRecipeUseCase } from "@application/recipes/create/create-recipe-use-case";
import type { DeleteRecipeUseCase } from "@application/recipes/delete/delete-recipe-use-case";
import type { RecipeDetailStore } from "@application/recipes/detail/recipe-detail-store-contract";
import type { GenerateRecipeUseCase } from "@application/recipes/generate/generate-recipe-use-case";
import type { RecipeListStore } from "@application/recipes/list/recipe-list-store-contract";
import { configureRecipeAuthoringStore } from "@application/recipes/create/recipe-authoring-store";
import type { MyRecipesStore } from "@application/recipes/my-recipes/my-recipes-store-contract";
import type { RefineRecipeUseCase } from "@application/recipes/refine/refine-recipe-use-case";
import type { BoundStore } from "@application/store/bound-store";
import { UnknownFailure } from "@core/failure";
import { fail, ok } from "@core/result/result-helpers";
import type { CreateRecipeInput } from "@domain/recipes/create/create-recipe-input";
import { Difficulty } from "@domain/recipes/difficulty";
import { RecipeEntity } from "@domain/recipes/recipe-entity";
import { RecipeSummaryEntity } from "@domain/recipes/recipe-summary-entity";
import { CuisineKey } from "@domain/recipes/taxonomy/cuisine-key";
import { RecipeCategory } from "@domain/recipes/taxonomy/recipe-category";

const makeRecipe = (
  overrides: Partial<Parameters<typeof RecipeEntity.create>[0]> = {},
): RecipeEntity => {
  const result = RecipeEntity.create({
    origin: RecipeOrigin.User,
    id: "r1",
    name: "My Recipe",
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    ingredients: ["flour"],
    instructions: ["mix"],
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 2,
    caloriesPerServing: 0,
    image: "https://cdn.example.com/r1.webp",
    media: [{ type: "image", url: "https://cdn.example.com/r1.webp" }],
    rating: 4.5,
    tags: [],
    mealType: [],
    ownerId: "owner-1",
    likeCount: 0,
    viewCount: 0,
    moderationStatus: "approved",
    isPublished: true,
    commentCount: 0,
    ...overrides,
      sourcePlatform: null,
    aiWritten: false,
  });
  if (!result.ok) throw new Error("failed to build Recipe fixture");
  return result.value;
};

const createInput: CreateRecipeInput = {
  name: { en: "New Recipe" },
  cuisine: CuisineKey.Italian,
  category: RecipeCategory.Dinner,
  difficulty: Difficulty.Easy,
  ingredients: { en: ["flour"] },
  instructions: { en: ["mix"] },
  prepTimeMinutes: 5,
  cookTimeMinutes: 10,
  servings: 2,
  media: [],
};

// Hand-rolled fakes — construction requires all use cases, but each test only
// exercises the one(s) relevant to its scenario.
const fakeGenerateUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure("not used"))),
} as unknown as GenerateRecipeUseCase;


const fakeRefineUseCase = {
  execute: () => Promise.resolve(fail(new UnknownFailure("not used"))),
} as unknown as RefineRecipeUseCase;

type Deps = Parameters<typeof configureRecipeAuthoringStore>[0];

const makeStore = (overrides: Partial<Deps> = {}) => {
  const recipeListStoreRemove = jest.fn();
  const recipeDetailStoreRemove = jest.fn();
  const mineAdded = jest.fn();
  const mineRemoved = jest.fn();
  const store = configureRecipeAuthoringStore({
    createRecipeUseCase: { execute: () => Promise.resolve(fail(new UnknownFailure("not used"))) } as unknown as CreateRecipeUseCase,
    generateRecipeUseCase: fakeGenerateUseCase,
    refineRecipeUseCase: fakeRefineUseCase,
    deleteRecipeUseCase: { execute: () => Promise.resolve(ok(undefined)) } as unknown as DeleteRecipeUseCase,
    recipeListStore: { getState: () => ({ remove: recipeListStoreRemove }) } as unknown as BoundStore<RecipeListStore>,
    recipeDetailStore: { getState: () => ({ remove: recipeDetailStoreRemove, put: jest.fn() }) } as unknown as BoundStore<RecipeDetailStore>,
    myRecipesStore: { getState: () => ({ addLocal: mineAdded, removeLocal: mineRemoved }) } as unknown as BoundStore<MyRecipesStore>,
    ...overrides,
  });
  return { store, recipeListStoreRemove, recipeDetailStoreRemove, mineAdded, mineRemoved };
};

describe("recipeAuthoringStore CRUD", () => {
  it("add keeps the full recipe for findById and puts its summary at the top of the Created list", () => {
    const { store, mineAdded } = makeStore();
    const recipe = makeRecipe({ id: "r-added", name: "Added Recipe" });

    store.getState().add(recipe);

    expect(store.getState().findById("r-added")).toBe(recipe);
    expect(mineAdded).toHaveBeenCalledWith(expect.any(RecipeSummaryEntity));
    expect((mineAdded.mock.calls[0][0] as RecipeSummaryEntity).name).toBe("Added Recipe");
  });

  it("remove forgets the local recipe and takes it off the Created list", () => {
    const { store, mineRemoved } = makeStore();
    store.getState().add(makeRecipe({ id: "r-kept" }));
    store.getState().add(makeRecipe({ id: "r-removed" }));

    store.getState().remove("r-removed");

    expect(store.getState().localRecipes.map((r) => r.id)).toEqual(["r-kept"]);
    expect(mineRemoved).toHaveBeenCalledWith("r-removed");
  });

  it("findById answers only recipes created on this device", () => {
    const { store } = makeStore();
    const localOnly = makeRecipe({ id: "local-only" });
    store.getState().add(localOnly);

    expect(store.getState().findById("network-only")).toBeUndefined();
    expect(store.getState().findById("local-only")).toBe(localOnly);
  });

  it("a created recipe lands in the Created list", async () => {
    const createRecipeUseCase = { execute: () => Promise.resolve(ok(makeRecipe({ id: "r-created" }))) } as unknown as CreateRecipeUseCase;
    const { store, mineAdded } = makeStore({ createRecipeUseCase });

    await store.getState().createRecipe(createInput);

    expect(store.getState().createState.status).toBe("success");
    expect(store.getState().localRecipes.map((r) => r.id)).toEqual(["r-created"]);
    expect(mineAdded).toHaveBeenCalledTimes(1);
  });

  it("a failed create changes no list", async () => {
    const failure = new UnknownFailure("boom");
    const createRecipeUseCase = { execute: () => Promise.resolve(fail(failure)) } as unknown as CreateRecipeUseCase;
    const { store, mineAdded } = makeStore({ createRecipeUseCase });

    await store.getState().createRecipe(createInput);

    expect(store.getState().createState).toEqual({ status: "error", failure });
    expect(store.getState().localRecipes).toEqual([]);
    expect(mineAdded).not.toHaveBeenCalled();
  });

  it("a deleted recipe leaves the Created list, the feed and the detail cache", async () => {
    const { store, recipeListStoreRemove, recipeDetailStoreRemove, mineRemoved } = makeStore();
    store.getState().add(makeRecipe({ id: "r-to-delete" }));

    await store.getState().deleteRecipe("r-to-delete");

    expect(store.getState().localRecipes).toEqual([]);
    expect(store.getState().deleteState).toEqual({ status: "success" });
    expect(mineRemoved).toHaveBeenCalledWith("r-to-delete");
    expect(recipeListStoreRemove).toHaveBeenCalledWith("r-to-delete");
    expect(recipeDetailStoreRemove).toHaveBeenCalledWith("r-to-delete");
  });

  it("a failed delete touches nothing else", async () => {
    const failure = new UnknownFailure("cannot delete");
    const deleteRecipeUseCase = { execute: () => Promise.resolve(fail(failure)) } as unknown as DeleteRecipeUseCase;
    const { store, recipeListStoreRemove, mineRemoved } = makeStore({ deleteRecipeUseCase });
    store.getState().add(makeRecipe({ id: "r-stays" }));

    await store.getState().deleteRecipe("r-stays");

    expect(store.getState().deleteState).toEqual({ status: "error", failure });
    expect(store.getState().localRecipes.map((r) => r.id)).toEqual(["r-stays"]);
    expect(mineRemoved).not.toHaveBeenCalled();
    expect(recipeListStoreRemove).not.toHaveBeenCalled();
  });
});
