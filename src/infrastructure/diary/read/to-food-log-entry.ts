import type { Mapper } from '@core/mapper/mapper';
import type { ValidationFailure } from '@core/failure';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { FoodLogEntryDto } from '@infrastructure/diary/dtos/food-log-entry-dto';
import { toMealSlot } from '@infrastructure/diary/read/to-meal-slot';
import { toNutrients } from '@infrastructure/diary/read/to-nutrients';

/** `FoodLogEntryDto` → `FoodLogEntryEntity`, validating the date, meal and nutrients on the way. */
export const toFoodLogEntry: Mapper<FoodLogEntryDto, FoodLogEntryEntity, ValidationFailure> = (dto) => {
  const date = CalendarDate.create(dto.date);
  if (!date.ok) return date;
  const meal = toMealSlot(dto.meal);
  if (!meal.ok) return meal;
  const nutrients = toNutrients(dto);
  if (!nutrients.ok) return nutrients;
  return FoodLogEntryEntity.create({
    id: dto.id,
    date: date.value,
    meal: meal.value,
    name: dto.name,
    servings: dto.servings,
    nutrients: nutrients.value,
    recipeId: dto.recipeId,
    recipeImageUrl: dto.recipeImageUrl,
  });
};
