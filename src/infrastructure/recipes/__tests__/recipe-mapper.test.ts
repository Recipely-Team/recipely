import { toRecipe, toRecipeSummary } from '@infrastructure/recipes/recipe-mapper';
import type { RecipeDto } from '@infrastructure/recipes/dtos/recipe-dto';
import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';
import { recipeToSummary } from '@domain/recipes/recipe-to-summary';
import { MediaType } from '@domain/recipes/media/media-type';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const fullDto: RecipeDto = {
  id: '7d1f0a3c-2b8d-4c89-9e10-4d2f1cde1234',
  name: 'Classic Margherita Pizza',
  cuisine: CuisineKey.Italian,
  category: RecipeCategory.Dinner,
  difficulty: Difficulty.Easy,
  ingredients: ['Flour', 'Tomato', 'Mozzarella'],
  instructions: ['Make dough', 'Add toppings', 'Bake'],
  prepTimeMinutes: 20,
  cookTimeMinutes: 15,
  servings: 4,
  caloriesPerServing: 320,
  image: 'https://cdn.recipely.io/recipe-images/1.webp',
  rating: 4.6,
  tags: ['Pizza', 'Italian'],
  mealType: ['Dinner'],
  ownerId: 'b1c2d3e4-f567-4890-abcd-ef0123456789',
  likeCount: 12,
  likedByMe: false,
  commentCount: 3,
  viewCount: 42,
  moderationStatus: 'approved',
  createdAt: '2026-04-01T12:00:00.000Z',
  updatedAt: '2026-04-01T12:00:00.000Z',
};

describe('toRecipe', () => {
  it('maps a RecipeDto into a Recipe', () => {
    const r = toRecipe(fullDto);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.id).toBe('7d1f0a3c-2b8d-4c89-9e10-4d2f1cde1234');
      expect(r.value.name).toBe('Classic Margherita Pizza');
      expect(r.value.cuisine).toBe(CuisineKey.Italian);
      expect(r.value.category).toBe(RecipeCategory.Dinner);
      expect(r.value.difficulty).toBe(Difficulty.Easy);
      expect(r.value.ingredients).toEqual(['Flour', 'Tomato', 'Mozzarella']);
      expect(r.value.instructions).toEqual(['Make dough', 'Add toppings', 'Bake']);
      expect(r.value.prepTimeMinutes).toBe(20);
      expect(r.value.cookTimeMinutes).toBe(15);
      expect(r.value.rating).toBe(4.6);
      expect(r.value.ownerId).toBe('b1c2d3e4-f567-4890-abcd-ef0123456789');
      expect(r.value.mealType).toEqual(['Dinner']);
      expect(r.value.media).toEqual([
        { type: 'image', url: 'https://cdn.recipely.io/recipe-images/1.webp' },
      ]);
    }
  });

  it('maps media to an empty gallery when there is no media and the cover image is empty', () => {
    const r = toRecipe({ ...fullDto, media: [], image: '' });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.media).toEqual([]);
    }
  });

  it('maps media to an empty gallery when the cover image is whitespace only', () => {
    const r = toRecipe({ ...fullDto, media: undefined, image: '  ' });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.media).toEqual([]);
    }
  });

  it('rejects a DTO with empty name', () => {
    const r = toRecipe({ ...fullDto, name: '' });
    expect(r.ok).toBe(false);
  });
});

describe('toRecipe — nutrition', () => {
  it('carries the serving weight through with the macros, unchanged', () => {
    const nutrition = { protein: 24, carbs: 60, fat: 18, fiber: 6, servingWeightGrams: 380 };
    const r = toRecipe({ ...fullDto, nutrition });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.nutrition).toEqual(nutrition);
      expect(r.value.nutritionFacts.servingWeightGrams).toBe(380);
    }
  });

  it('leaves the serving weight absent when the backend sends none', () => {
    const r = toRecipe({ ...fullDto, nutrition: { protein: 24 } });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.nutritionFacts.servingWeightGrams).toBeUndefined();
  });
});

describe('photo count — the card chip', () => {
  const listDto: RecipeListItemDto = {
    id: 'r1',
    name: 'Classic Margherita Pizza',
    image: 'https://cdn.recipely.io/recipe-images/1.webp',
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    rating: 4.6,
    moderationStatus: 'approved',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    viewCount: 0,
  };

  it('carries the list row mediaCount into the summary', () => {
    const r = toRecipeSummary({ ...listDto, mediaCount: 4 });

    expect(r.ok && r.value.photoCount).toBe(4);
  });

  it('carries the list row caloriesPerServing, so the diary can offer and label the recipe', () => {
    const r = toRecipeSummary({ ...listDto, caloriesPerServing: 350 });

    expect(r.ok && r.value.caloriesPerServing).toBe(350);
    expect(r.ok && r.value.hasCalories).toBe(true);
  });

  it('reads a list row without caloriesPerServing (an older or cached response) as unknown', () => {
    const r = toRecipeSummary(listDto);

    expect(r.ok && r.value.caloriesPerServing).toBe(0);
    expect(r.ok && r.value.hasCalories).toBe(false);
  });

  it('reads an older server that sends no mediaCount as zero, which hides the chip', () => {
    const r = toRecipeSummary(listDto);

    expect(r.ok && r.value.photoCount).toBe(0);
  });

  it('counts a full recipe the way the detail hero does when it is patched into a list', () => {
    const r = toRecipe({
      ...fullDto,
      media: [
        { id: 'a', position: 0, type: MediaType.Image, url: 'https://cdn.recipely.io/a.webp' },
        { id: 'b', position: 1, type: MediaType.Video, url: 'https://cdn.recipely.io/b.mp4' },
        { id: 'c', position: 2, type: MediaType.Image, url: 'https://cdn.recipely.io/c.webp' },
      ],
    });
    if (!r.ok) throw new Error('fixture recipe invalid');

    const summary = recipeToSummary(r.value, false);

    expect(summary.ok && summary.value.photoCount).toBe(2);
    expect(summary.ok && summary.value.caloriesPerServing).toBe(r.value.caloriesPerServing);
  });
});

/**
 * Cards and the hero crop each photo on the focal point the backend's sweep
 * found. A photo it has not reached — or a server that predates the field —
 * sends nothing and the crop stays centred; a point outside the frame is
 * dropped rather than failing the recipe.
 */
describe('photo focus', () => {
  const mediaRow = { id: 'm1', type: MediaType.Image, url: 'https://cdn.recipely.io/m1.jpg', position: 0 };

  it('carries each gallery photo focus and the cover focus into the domain', () => {
    const r = toRecipe({
      ...fullDto,
      imageFocus: { x: 0.3, y: 0.6 },
      media: [{ ...mediaRow, focus: { x: 0.2, y: 0.8 } }, { ...mediaRow, id: 'm2' }],
    });

    if (!r.ok) throw new Error('expected a recipe');
    expect([r.value.imageFocus?.x, r.value.imageFocus?.y]).toEqual([0.3, 0.6]);
    expect([r.value.media[0]?.focus?.x, r.value.media[0]?.focus?.y]).toEqual([0.2, 0.8]);
    expect(r.value.media[1]).not.toHaveProperty('focus');
  });

  it('gives a lone cover promoted into the gallery the cover focus', () => {
    const r = toRecipe({ ...fullDto, imageFocus: { x: 0.1, y: 0.9 } });

    expect(r.ok && r.value.media[0]?.focus?.x).toBe(0.1);
  });

  it('drops a focus outside the frame instead of failing the recipe', () => {
    const r = toRecipe({ ...fullDto, imageFocus: { x: 1.2, y: 0.5 }, media: [{ ...mediaRow, focus: { x: 0.5, y: -0.1 } }] });

    if (!r.ok) throw new Error('expected a recipe');
    expect(r.value.imageFocus).toBeUndefined();
    expect(r.value.media[0]?.focus).toBeUndefined();
  });

  it('carries the cover focus onto the summary a card is drawn from, by both roads', () => {
    const listDto: RecipeListItemDto = {
      id: 'r1', name: 'Pizza', image: 'https://cdn.recipely.io/1.webp', cuisine: CuisineKey.Italian,
      category: RecipeCategory.Dinner, difficulty: Difficulty.Easy, rating: 4, moderationStatus: 'approved',
      likeCount: 0, likedByMe: false, commentCount: 0, viewCount: 0, imageFocus: { x: 0.25, y: 0.75 },
    };
    const fromList = toRecipeSummary(listDto);
    const full = toRecipe({ ...fullDto, imageFocus: { x: 0.25, y: 0.75 } });
    if (!full.ok) throw new Error('expected a recipe');
    const fromDetail = recipeToSummary(full.value, false);

    expect(fromList.ok && fromList.value.imageFocus?.y).toBe(0.75);
    expect(fromDetail.ok && fromDetail.value.imageFocus?.y).toBe(0.75);
    expect(toRecipeSummary({ ...listDto, imageFocus: undefined }).ok).toBe(true);
  });
});

/**
 * The symptom: 25 recipes on the server carry "Easy" or "Medium" in `tags`,
 * written by an editor that saved the difficulty there in English. The detail
 * screen printed it beside the localised difficulty — "Medium" on a Turkish
 * screen. Those rows stay on the server, so the mapper drops them.
 */
describe('toRecipe — tags', () => {
  it('shows no "Medium" chip for a recipe saved with its difficulty as a tag', () => {
    const result = toRecipe({ ...fullDto, tags: ['Medium', 'Tatlı', 'easy ', 'HARD'] });

    expect(result.ok && result.value.tags).toEqual(['Tatlı']);
  });
});
