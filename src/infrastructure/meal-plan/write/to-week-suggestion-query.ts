import type { RequestMapper } from '@core/mapper/request-mapper';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { WeekSuggestionQueryDto } from '@infrastructure/meal-plan/dtos/week-suggestion-query-dto';
import { toMealSlotWire } from '@infrastructure/diary/write/to-meal-slot-wire';

const MEAL_SEPARATOR = ',';

export const toWeekSuggestionQuery: RequestMapper<
  { weekStart: CalendarDate; meals: readonly MealSlotType[]; seed: number },
  WeekSuggestionQueryDto
> = ({ weekStart, meals, seed }) => ({ weekStart: weekStart.value, meals: meals.map(toMealSlotWire).join(MEAL_SEPARATOR), seed });
