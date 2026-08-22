import { StoreStatus } from '@application/store/store-status';
import { fromRecipeIdOf } from '@presentation/app/create-recipe/model/drafting/from-recipe-id-of';
import type { RecipeDetailState } from '@application/recipes/detail/recipe-detail-state';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

/**
 * Asked to make the same recipe, the assistant used to hand the words to the
 * generator, which invented something adjacent. A copy is seeded from the
 * recipe itself — and from the RIGHT one: the detail store holds every recipe
 * the session has opened, so reading it by key is what stops the copy being
 * filled from whichever was looked at last.
 */
describe('fromRecipeIdOf', () => {
  const recipe = { id: 'r1' } as RecipeEntity;
  const loaded: Record<string, RecipeDetailState> = {
    r1: { status: StoreStatus.Loaded, recipe, fetchedAt: 0 },
    r2: { status: StoreStatus.Loaded, recipe: { id: 'r2' } as RecipeEntity, fetchedAt: 0 },
  };

  it('returns the recipe asked for, not another the session has open', () => {
    expect(fromRecipeIdOf(loaded, 'r1')).toBe(recipe);
  });

  it('waits rather than seeding from a recipe still loading', () => {
    expect(fromRecipeIdOf({ r1: { status: StoreStatus.Loading } }, 'r1')).toBeNull();
  });

  it('gives nothing when the load failed', () => {
    const failed = { r1: { status: StoreStatus.Error, failure: {} } } as unknown as Record<
      string,
      RecipeDetailState
    >;

    expect(fromRecipeIdOf(failed, 'r1')).toBeNull();
  });

  it('gives nothing when no copy was asked for', () => {
    expect(fromRecipeIdOf(loaded, undefined)).toBeNull();
  });
});
