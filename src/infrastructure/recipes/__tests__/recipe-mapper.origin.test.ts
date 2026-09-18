/**
 * Where a recipe came from has to survive the wire.
 *
 * The server only started recording it recently, so the app reads a field that
 * is absent on every recipe written before then — and will be absent again the
 * moment someone points the app at an older backend. Neither may draw a badge,
 * and neither may crash.
 */

import { toRecipe } from '@infrastructure/recipes/recipe-mapper';
import { RecipeOrigin } from '@domain/recipes/recipe-origin';
import type { RecipeDto } from '@infrastructure/recipes/dtos/recipe-dto';

const dto = (overrides: Partial<RecipeDto> = {}): RecipeDto =>
  ({
    id: 'r1',
    name: 'Fırında Sütlaç',
    cuisine: 'TURKISH',
    category: 'DESSERT',
    difficulty: 'EASY',
    ingredients: ['1 litre süt'],
    instructions: ['Pişir.'],
    prepTimeMinutes: 15,
    cookTimeMinutes: 60,
    servings: 6,
    caloriesPerServing: 240,
    image: 'https://cdn.example.com/a.jpg',
    rating: 0,
    tags: [],
    mealType: [],
    ownerId: 'u1',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
    viewCount: 0,
    moderationStatus: 'approved',
    ...overrides,
  }) as RecipeDto;

/** The mapper returns a Result; every case here is expected to map cleanly. */
const mapped = (overrides: Partial<RecipeDto> = {}) => {
  const result = toRecipe(dto(overrides));
  if (!result.ok) throw new Error('expected the recipe to map');
  return result.value;
};

describe('toRecipe — where the recipe came from', () => {
  it('carries an import and the account it was lifted from', () => {
    const entity = mapped({
      origin: 'IMPORT',
      sourceUrl: 'https://www.instagram.com/reel/Cxyz123/',
      sourceHandle: 'birseyler_pisiyor',
    });

    expect(entity.origin).toBe(RecipeOrigin.Import);
    expect(entity.sourceHandle).toBe('birseyler_pisiyor');
    expect(entity.sourceUrl).toBe('https://www.instagram.com/reel/Cxyz123/');
  });

  it('carries a recipe a model wrote', () => {
    expect(mapped({ origin: 'AI' }).origin).toBe(RecipeOrigin.Ai);
  });

  // Every recipe published before the server recorded this has no field at all.
  it('reads a recipe with no origin as one a person wrote', () => {
    expect(mapped().origin).toBe(RecipeOrigin.User);
  });

  // A server that grows a fourth kind must not make the app draw a badge it has
  // no words for.
  it('reads an origin it does not know as one a person wrote', () => {
    expect(mapped({ origin: 'SCRAPED' }).origin).toBe(RecipeOrigin.User);
  });

  it('leaves the account absent when the import named none', () => {
    const entity = mapped({ origin: 'IMPORT' });

    expect(entity.origin).toBe(RecipeOrigin.Import);
    expect(entity.sourceHandle).toBeUndefined();
  });
});
