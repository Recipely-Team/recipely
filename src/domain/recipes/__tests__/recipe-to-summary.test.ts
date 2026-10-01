import { RecipeEntity } from '@domain/recipes/recipe-entity';
import { recipeToSummary } from '@domain/recipes/recipe-to-summary';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';
import { NutritionSource } from '@domain/recipes/nutrition/nutrition-source';
import { ImageCredit } from '@domain/recipes/media/image-credit';

const makeRecipe = (overrides: Partial<Parameters<typeof RecipeEntity.create>[0]> = {}): RecipeEntity => {
  const result = RecipeEntity.create({
    origin: RecipeOrigin.User,
    id: 'r1',
    name: 'Margherita Pizza',
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    ingredients: ['Flour', 'Tomato', 'Mozzarella'],
    instructions: ['Make dough', 'Add toppings', 'Bake'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 4,
    caloriesPerServing: 320,
    image: 'https://cdn.dummyjson.com/recipe-images/1.webp',
    media: [{ type: 'image', url: 'https://cdn.dummyjson.com/recipe-images/1.webp' }],
    rating: 4.6,
    tags: ['Pizza', 'Italian'],
    mealType: ['Dinner'],
    ownerId: 'o1',
    likeCount: 5,
    likedByMe: true,
    viewCount: 42,
    moderationStatus: 'approved',
    isPublished: true,
    commentCount: 3,
    ...overrides,
      sourcePlatform: null,
    aiWritten: false,
  });
  if (!result.ok) throw new Error('failed to build Recipe fixture');
  return result.value;
};

describe('recipeToSummary', () => {
  it('maps every field from the source Recipe onto a RecipeSummaryEntity', () => {
    const recipe = makeRecipe();

    const result = recipeToSummary(recipe);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(recipe.id);
      expect(result.value.name).toBe(recipe.name);
      expect(result.value.image).toBe(recipe.image);
      expect(result.value.cuisine).toBe(recipe.cuisine);
      expect(result.value.category).toBe(recipe.category);
      expect(result.value.difficulty).toBe(recipe.difficulty);
      expect(result.value.rating).toBe(recipe.rating);
      expect(result.value.moderationStatus).toBe(recipe.moderationStatus);
      expect(result.value.likeCount).toBe(recipe.likeCount);
      expect(result.value.likedByMe).toBe(recipe.likedByMe);
      expect(result.value.commentCount).toBe(recipe.commentCount);
      expect(result.value.viewCount).toBe(recipe.viewCount);
    }
  });

  it('derives totalTimeMinutes as prepTimeMinutes + cookTimeMinutes', () => {
    const recipe = makeRecipe({ prepTimeMinutes: 10, cookTimeMinutes: 20 });

    const result = recipeToSummary(recipe);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.totalTimeMinutes).toBe(30);
  });

  it('keeps a Recipely Kitchen recipe curated on both shapes', () => {
    const recipe = makeRecipe({ origin: RecipeOrigin.Curated });
    const result = recipeToSummary(recipe);
    expect(recipe.isCurated).toBe(true);
    expect(result.ok && result.value.isCurated).toBe(true);
    expect(makeRecipe().isCurated).toBe(false);
  });

  // A just-published Kitchen recipe reaches the feed cache this way; dropping the
  // credit would hide it until a refresh.
  it('carries the photo credit and nutrition source', () => {
    const created = ImageCredit.create('Jane Doe', 'CC0', 'https://commons.wikimedia.org/wiki/File:Pilaf.jpg');
    if (!created.ok) throw new Error('expected a credit');
    const credit = created.value;
    const result = recipeToSummary(makeRecipe({ imageCredit: credit, nutritionSource: NutritionSource.Usda }));
    if (!result.ok) throw new Error('expected a summary');
    expect(result.value.imageCredit?.equals(credit)).toBe(true);
    expect(result.value.nutritionSource).toBe(NutritionSource.Usda);
  });

  // No contrived failure-path test here: recipeToSummary only ever fails if a
  // Recipe with an empty id/name is passed in, but Recipe.create already
  // guards against that at construction time, so there is no reachable
  // failure branch to exercise from valid `Recipe` inputs.
});
