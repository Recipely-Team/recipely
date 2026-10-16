import { ok } from '@core/result/result-helpers';
import type { Mapper } from '@core/mapper/mapper';
import type { ValidationFailure } from '@core/failure';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { PlannedRecipe } from '@domain/meal-plan/planned-recipe';
import type { SuggestedSlot } from '@domain/meal-plan/suggest/suggested-slot';
import type { WeekSuggestion } from '@domain/meal-plan/suggest/week-suggestion';
import { toMealSlot } from '@infrastructure/diary/read/to-meal-slot';
import type { PlannedRecipeDto } from '@infrastructure/meal-plan/dtos/planned-recipe-dto';
import type { WeekSuggestionDto } from '@infrastructure/meal-plan/dtos/week-suggestion-dto';

const recipeOf = (dto: PlannedRecipeDto | null): PlannedRecipe | null =>
  dto === null
    ? null
    : { id: dto.id, name: dto.name, imageUrl: dto.imageUrl, caloriesPerServing: dto.caloriesPerServing, servings: dto.servings, totalTimeMinutes: dto.totalTimeMinutes };

/** A drafted week; a slot whose date or meal this build cannot read is dropped, not guessed. */
export const toWeekSuggestion: Mapper<WeekSuggestionDto, WeekSuggestion, ValidationFailure> = (dto) => {
  const weekStart = CalendarDate.create(dto.weekStart);
  if (!weekStart.ok) return weekStart;
  const slots: SuggestedSlot[] = [];
  for (const slot of dto.slots) {
    const date = CalendarDate.create(slot.date);
    const meal = toMealSlot(slot.meal);
    if (!date.ok || !meal.ok) continue;
    slots.push({ date: date.value, meal: meal.value, pick: recipeOf(slot.pick), alternative: recipeOf(slot.alternative) });
  }
  return ok({ weekStart: weekStart.value, slots, poolSize: dto.poolSize });
};
