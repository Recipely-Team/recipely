import { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RecipeEntityProps } from '@domain/recipes/recipe-entity-props';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';
import { Difficulty } from '@domain/recipes/difficulty';
import { MediaType } from '@domain/recipes/media/media-type';

const COVER = 'https://cdn.example.test/cover.jpg';

/**
 * A valid recipe for a test, with only the fields the test is about overridden.
 * Defaults to a private recipe the owner has not offered for publishing yet.
 */
export const recipeEntityOf = (overrides: Partial<RecipeEntityProps> = {}): RecipeEntity => {
  const created = RecipeEntity.create({
    id: 'recipe-1',
    name: 'Menemen',
    cuisine: 'TURKISH',
    category: 'BREAKFAST',
    difficulty: Difficulty.Easy,
    ingredients: ['2 eggs', '1 tomato'],
    instructions: ['Cook the tomato', 'Add the eggs'],
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    servings: 2,
    caloriesPerServing: 250,
    image: COVER,
    media: [{ id: 'media-cover', type: MediaType.Image, url: COVER }],
    rating: 0,
    tags: [],
    mealType: [],
    ownerId: 'owner-1',
    likeCount: 0,
    likedByMe: false,
    viewCount: 0,
    origin: RecipeOrigin.User,
    sourcePlatform: null,
    aiWritten: false,
    isPublished: false,
    moderationStatus: 'unreviewed',
    commentCount: 0,
    ...overrides,
  });
  if (!created.ok) throw new Error(created.failure.message);
  return created.value;
};
