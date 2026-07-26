import { RecipeEntity } from '@domain/recipes/recipe-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const validProps = {
  id: 'r1',
  name: 'Margherita Pizza',
  cuisine: CuisineKey.Italian,
  category: RecipeCategory.Dinner,
  difficulty: Difficulty.Easy,
  ingredients: ['Flour', 'Tomato', 'Mozzarella'],
  instructions: ['Make dough', 'Add toppings', 'Bake'],
  prepTimeMinutes: 20,
  cookTimeMinutes: 15,
  servings: 4,
  caloriesPerServing: 320,
  image: 'https://cdn.dummyjson.com/recipe-images/1.webp',
  media: [{ type: 'image' as const, url: 'https://cdn.dummyjson.com/recipe-images/1.webp' }],
  rating: 4.6,
  tags: ['Pizza', 'Italian'],
  mealType: ['Dinner'],
  ownerId: 'o1',
  likeCount: 0,
  likedByMe: false,
  viewCount: 0,
  moderationStatus: 'approved',
  commentCount: 0,
};

describe('Recipe.create', () => {
  it('accepts valid props', () => {
    const r = RecipeEntity.create(validProps);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.id).toBe('r1');
      expect(r.value.name).toBe('Margherita Pizza');
      expect(r.value.cuisine).toBe(CuisineKey.Italian);
      expect(r.value.category).toBe(RecipeCategory.Dinner);
      expect(r.value.difficulty).toBe(Difficulty.Easy);
      expect(r.value.ingredients).toEqual(['Flour', 'Tomato', 'Mozzarella']);
    }
  });

  it.each([
    ['id', { ...validProps, id: ' ' }],
    ['name', { ...validProps, name: '' }],
  ])('rejects blank %s', (field, props) => {
    const r = RecipeEntity.create(props);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.field).toBe(field);
  });

  it('entity equality is id-based', () => {
    const a = RecipeEntity.create(validProps);
    const b = RecipeEntity.create({ ...validProps, name: 'Different' });

    if (a.ok && b.ok) expect(a.value.equals(b.value)).toBe(true);
  });
});
