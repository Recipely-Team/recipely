import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

const validProps = {
  id: 'r1',
  name: 'Margherita Pizza',
  image: 'https://cdn.dummyjson.com/recipe-images/1.webp',
  cuisine: CuisineKey.Italian,
  category: RecipeCategory.Dinner,
  difficulty: Difficulty.Easy,
  totalTimeMinutes: 35,
  rating: 4.6,
  moderationStatus: 'approved',
  likeCount: 3,
  likedByMe: true,
  commentCount: 2,
  viewCount: 100,
};

describe('RecipeSummaryEntity.create', () => {
  it('accepts valid props', () => {
    const r = RecipeSummaryEntity.create(validProps);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.id).toBe('r1');
      expect(r.value.name).toBe('Margherita Pizza');
      expect(r.value.image).toBe('https://cdn.dummyjson.com/recipe-images/1.webp');
      expect(r.value.cuisine).toBe(CuisineKey.Italian);
      expect(r.value.category).toBe(RecipeCategory.Dinner);
      expect(r.value.difficulty).toBe(Difficulty.Easy);
      expect(r.value.totalTimeMinutes).toBe(35);
      expect(r.value.rating).toBe(4.6);
      expect(r.value.moderationStatus).toBe('approved');
      expect(r.value.likeCount).toBe(3);
      expect(r.value.likedByMe).toBe(true);
      expect(r.value.commentCount).toBe(2);
      expect(r.value.viewCount).toBe(100);
    }
  });

  it.each([
    ['id', { ...validProps, id: ' ' }],
    ['name', { ...validProps, name: '' }],
  ])('rejects blank %s', (field, props) => {
    const r = RecipeSummaryEntity.create(props);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.field).toBe(field);
  });

  it('entity equality is id-based', () => {
    const a = RecipeSummaryEntity.create(validProps);
    const b = RecipeSummaryEntity.create({ ...validProps, name: 'Different' });

    if (a.ok && b.ok) expect(a.value.equals(b.value)).toBe(true);
  });
});
