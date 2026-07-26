import { toRecipe } from '@infrastructure/recipes/recipe-mapper';
import type { RecipeDto } from '@infrastructure/recipes/dtos/recipe-dto';
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
