import type { Mapper } from '@core/mapper/mapper';
import type { ValidationFailure } from '@core/failure';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { Servings } from '@domain/diary/entry/servings';
import { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import { toMealSlot } from '@infrastructure/diary/read/to-meal-slot';
import type { MealPlanEntryDto } from '@infrastructure/meal-plan/dtos/meal-plan-entry-dto';

/**
 * `MealPlanEntryDto` → `MealPlanEntryEntity`, validating the date, the meal
 * and the servings (the diary's 0.5 steps) on the way; the recipe read model
 * is taken as sent.
 */
export const toMealPlanEntry: Mapper<MealPlanEntryDto, MealPlanEntryEntity, ValidationFailure> = (dto) => {
  const date = CalendarDate.create(dto.date);
  if (!date.ok) return date;
  const meal = toMealSlot(dto.meal);
  if (!meal.ok) return meal;
  const servings = Servings.create(dto.servings);
  if (!servings.ok) return servings;
  return MealPlanEntryEntity.create({
    id: dto.id,
    date: date.value,
    meal: meal.value,
    position: dto.position,
    servings: servings.value,
    eaten: dto.eaten,
    foodLogEntryId: dto.foodLogEntryId,
    recipe: {
      id: dto.recipe.id,
      name: dto.recipe.name,
      imageUrl: dto.recipe.imageUrl,
      caloriesPerServing: dto.recipe.caloriesPerServing,
      servings: dto.recipe.servings,
      totalTimeMinutes: dto.recipe.totalTimeMinutes,
    },
  });
};
