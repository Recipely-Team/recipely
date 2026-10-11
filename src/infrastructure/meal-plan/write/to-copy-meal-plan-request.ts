import type { RequestMapper } from '@core/mapper/request-mapper';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { CopyMealPlanRequestDto } from '@infrastructure/meal-plan/dtos/copy-meal-plan-request-dto';

/** The two weeks' Mondays → `POST /me/meal-plan/copy` body. */
export const toCopyMealPlanRequest: RequestMapper<{ from: CalendarDate; to: CalendarDate }, CopyMealPlanRequestDto> = ({ from, to }) => ({
  fromWeekStart: from.weekStart().value,
  toWeekStart: to.weekStart().value,
});
