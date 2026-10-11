import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import { Servings } from '@domain/diary/entry/servings';
import { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';

interface MealPlanEntryOverrides {
  id?: string;
  date?: string;
  meal?: MealSlotType;
  position?: number;
  servings?: number;
  eaten?: boolean;
  caloriesPerServing?: number | null;
  recipeId?: string;
  recipeName?: string;
}

/** A planned meal for tests: Monday 2026-10-12 dinner, 2 servings of a 400 kcal recipe, unless told otherwise. */
export const mealPlanEntryOf = (overrides: MealPlanEntryOverrides = {}): MealPlanEntryEntity => {
  const date = CalendarDate.create(overrides.date ?? '2026-10-12');
  const servings = Servings.create(overrides.servings ?? 2);
  if (!date.ok || !servings.ok) throw new Error('mealPlanEntryOf: bad fixture date or servings');
  const built = MealPlanEntryEntity.create({
    id: overrides.id ?? 'entry-1',
    date: date.value,
    meal: overrides.meal ?? MealSlot.Dinner,
    position: overrides.position ?? 0,
    servings: servings.value,
    eaten: overrides.eaten ?? false,
    foodLogEntryId: overrides.eaten === true ? 'log-1' : null,
    recipe: {
      id: overrides.recipeId ?? 'recipe-1',
      name: overrides.recipeName ?? 'Mercimek çorbası',
      imageUrl: null,
      caloriesPerServing: overrides.caloriesPerServing === undefined ? 400 : overrides.caloriesPerServing,
      servings: 4,
      totalTimeMinutes: 35,
    },
  });
  if (!built.ok) throw new Error(`mealPlanEntryOf: ${built.failure.message}`);
  return built.value;
};
