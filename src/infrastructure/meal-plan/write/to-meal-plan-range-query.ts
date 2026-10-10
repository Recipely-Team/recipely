import type { RequestMapper } from '@core/mapper/request-mapper';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealPlanRangeQueryDto } from '@infrastructure/meal-plan/dtos/meal-plan-range-query-dto';

/** An inclusive day range → the `from` / `to` query of the meal plan's range routes. */
export const toMealPlanRangeQuery: RequestMapper<{ from: CalendarDate; to: CalendarDate }, MealPlanRangeQueryDto> = ({ from, to }) => ({
  from: from.value,
  to: to.value,
});
