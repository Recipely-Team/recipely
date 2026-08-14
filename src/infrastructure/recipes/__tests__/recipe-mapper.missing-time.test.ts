/**
 * Reported from the live web app and visible in the App Store screenshots: the
 * hero card read "undefined dk" and the recipe cards "undefined min".
 *
 * The list DTO declared `totalTimeMinutes: number` — required — and the mapper
 * passed it straight through, so every type from the wire to the screen claimed
 * a number while the value was `undefined`. TypeScript could not catch it: a
 * DTO is an assertion about the wire, not a check of it. The backend simply
 * does not send timing for some recipes (AI-generated and imported ones).
 *
 * The absence is modelled now instead of asserted away, and the UI hides the
 * chip rather than printing whatever it was handed.
 */
import { toRecipeSummary } from '@infrastructure/recipes/recipe-mapper';
import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';

const dto = (overrides: Partial<RecipeListItemDto> = {}): RecipeListItemDto =>
  ({
    id: 'r1',
    name: 'Fıstıklı Baklava',
    image: 'https://cdn.example.com/baklava.webp',
    cuisine: 'turkish',
    category: 'dessert',
    difficulty: 'medium',
    totalTimeMinutes: 45,
    rating: 4.6,
    moderationStatus: 'approved',
    ...overrides,
  }) as RecipeListItemDto;

describe('toRecipeSummary — a recipe the backend has no timing for', () => {
  it('maps a missing total time to null rather than passing undefined through', () => {
    const result = toRecipeSummary(dto({ totalTimeMinutes: undefined }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.totalTimeMinutes).toBeNull();
  });

  it('still carries a real total time', () => {
    const result = toRecipeSummary(dto());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.totalTimeMinutes).toBe(45);
  });
});
