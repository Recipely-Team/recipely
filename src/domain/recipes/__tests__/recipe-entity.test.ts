import { RecipeEntity } from '@domain/recipes/recipe-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';

const validProps = {
  origin: RecipeOrigin.User,
  sourcePlatform: null,
  aiWritten: false,
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
  isPublished: true,
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

describe('RecipeEntity publishing state', () => {
  const privateProps = { ...validProps, isPublished: false, moderationStatus: 'unreviewed' };
  const make = (overrides: Partial<typeof privateProps> & { publishBlockers?: readonly ('photo' | 'ingredients' | 'instructions')[] } = {}) => {
    const r = RecipeEntity.create({ ...privateProps, ...overrides });
    if (!r.ok) throw new Error('invalid');
    return r.value;
  };

  it('a private recipe with nothing on its checklist can be published', () => {
    expect(make().canPublish).toBe(true);
  });

  it('a website import with blockers cannot', () => {
    const recipe = make({ publishBlockers: ['photo', 'ingredients'] });
    expect(recipe.canPublish).toBe(false);
    expect(recipe.publishBlockers).toEqual(['photo', 'ingredients']);
  });

  it('a rejected recipe can never be offered again', () => {
    expect(make({ moderationStatus: 'rejected' }).canPublish).toBe(false);
  });

  it('carries a publish outcome into a new entity', () => {
    const published = make().withPublishOutcome({ isPublished: true, moderationStatus: 'approved' });
    expect(published.ownerStatus).toBe('published');
  });

  it('after the cover goes, the next photo is the cover and the old one is gone everywhere', () => {
    const cover = { id: 'm1', type: 'image' as const, url: 'https://x.test/cover.jpg' };
    const next = { id: 'm2', type: 'image' as const, url: 'https://x.test/next.jpg' };
    const recipe = make({ image: cover.url, media: [cover, next] });

    expect(recipe.isCover(cover)).toBe(true);
    expect(recipe.isCover(next)).toBe(false);

    const after = recipe.withCoverRemoved({ image: next.url, removedMediaIds: ['m1'] });
    expect(after.image).toBe(next.url);
    expect(after.media).toEqual([next]);
  });

  it('a cover-only recipe ends with no photos at all', () => {
    const cover = { type: 'image' as const, url: 'https://x.test/cover.jpg' };
    const after = make({ image: cover.url, media: [cover] }).withCoverRemoved({ image: '', removedMediaIds: [] });
    expect(after.media).toEqual([]);
    expect(after.image).toBe('');
  });
});
