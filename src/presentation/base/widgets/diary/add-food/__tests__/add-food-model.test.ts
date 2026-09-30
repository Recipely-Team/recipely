import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot } from '@domain/diary/meal-slot';
import { LoggableFood } from '@domain/diary/entry/loggable-food';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { Difficulty } from '@domain/recipes/difficulty';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';
import type { RecipeSummaryEntityProps } from '@domain/recipes/recipe-summary-entity-props';
import { foodLogEntryOf } from '@domain/diary/__fixtures__/food-log-entry-of';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';
import { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';
import { AddFoodStep } from '@presentation/base/widgets/diary/add-food/state/add-food-step';
import { initialAddFoodState } from '@presentation/base/widgets/diary/add-food/state/initial-add-food-state';
import { buildRecipeFoodGroups } from '@presentation/base/widgets/diary/add-food/search/build-recipe-food-groups';
import { matchesFoodQuery } from '@presentation/base/widgets/diary/add-food/search/matches-food-query';

const date = CalendarDate.of(2026, 9, 30);
const at = (hour: number): Date => new Date(2026, 8, 30, hour);
const food = LoggableFood.of({ name: 'Menemen', perServing: nutrientsOf({ calories: 300 }), recipeId: 'r1', imageUrl: null });

const summary = (id: string, name: string): RecipeSummaryEntity => {
  const props: RecipeSummaryEntityProps = {
    id, name, image: '', cuisine: '', category: '', difficulty: Difficulty.Easy,
    totalTimeMinutes: null, rating: 0, isPublished: true, moderationStatus: 'approved', likeCount: 0, likedByMe: false,
    commentCount: 0, viewCount: 0, origin: RecipeOrigin.User, sourcePlatform: null, aiWritten: false, photoCount: 0,
  };
  const created = RecipeSummaryEntity.create(props);
  if (!created.ok) throw new Error(created.failure.message);
  return created.value;
};

describe('initialAddFoodState', () => {
  it('opens the pick step with the meal from the clock when none is given', () => {
    const state = initialAddFoodState({ kind: AddFoodRequestKind.Pick, date, meal: null }, at(13));
    expect(state.step).toBe(AddFoodStep.Pick);
    expect(state.meal).toBe(MealSlot.Lunch);
    expect(state.date.value).toBe('2026-09-30');
  });

  it('keeps a meal the caller chose, and a chosen food skips to the detail step at one serving', () => {
    const state = initialAddFoodState({ kind: AddFoodRequestKind.Food, date, meal: MealSlot.Snacks, food }, at(8));
    expect(state.step).toBe(AddFoodStep.Detail);
    expect(state.meal).toBe(MealSlot.Snacks);
    expect(state.servings.value).toBe(1);
    expect(state.canGoBack).toBe(false);
  });

  it('pre-fills an edit from its entry, on the entry’s own day, rounding the amount to the stepper', () => {
    const entry = foodLogEntryOf({ date: CalendarDate.of(2026, 9, 27), meal: MealSlot.Dinner, servings: 1.3 });
    const state = initialAddFoodState({ kind: AddFoodRequestKind.Edit, entry }, at(8));
    expect(state.date.value).toBe('2026-09-27');
    expect(state.meal).toBe(MealSlot.Dinner);
    expect(state.servings.value).toBe(1.5);
  });
});

describe('recipe search', () => {
  it('matches with the reader’s locale casing — Turkish İ is i', () => {
    expect(matchesFoodQuery('İzmir köfte', 'izmir', 'tr')).toBe(true);
    expect(matchesFoodQuery('Menemen', '  ', 'tr')).toBe(true);
    expect(matchesFoodQuery('Menemen', 'pilav', 'tr')).toBe(false);
  });

  it('lists a recipe once, in its first group, and drops empty groups', () => {
    const mine = summary('a', 'Menemen');
    const groups = buildRecipeFoodGroups({ mine: [mine], saved: [mine, summary('b', 'Pilav')], feed: [summary('a', 'Menemen')] }, '', 'en');
    expect(groups.map((g) => [g.key, g.recipes.map((r) => r.id)])).toEqual([
      ['mine', ['a']],
      ['saved', ['b']],
    ]);
  });

  it('filters every group by the search', () => {
    const groups = buildRecipeFoodGroups({ mine: [summary('a', 'Menemen')], saved: [summary('b', 'Pilav')], feed: [] }, 'pil', 'en');
    expect(groups.flatMap((g) => g.recipes.map((r) => r.id))).toEqual(['b']);
  });
});
