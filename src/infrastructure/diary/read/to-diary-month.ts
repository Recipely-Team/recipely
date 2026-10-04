import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { ValidationFailure } from '@core/failure';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import { DiaryMonth } from '@domain/diary/month/diary-month';
import type { DiaryDaySummary } from '@domain/diary/month/diary-day-summary';
import type { DiaryMonthDto } from '@infrastructure/diary/dtos/diary-month-dto';
import { toNutrients } from '@infrastructure/diary/read/to-nutrients';
import { toNutritionGoals } from '@infrastructure/diary/read/to-nutrition-goals';

/** `GET /diary/months/:month` → `DiaryMonth`. The month rows carry no fiber. */
export const toDiaryMonth: Mapper<DiaryMonthDto, DiaryMonth, ValidationFailure> = (dto) => {
  const month = CalendarMonth.create(dto.month);
  if (!month.ok) return month;
  const goals = toNutritionGoals(dto.goals);
  if (!goals.ok) return goals;
  const days: DiaryDaySummary[] = [];
  for (const row of dto.days) {
    const date = CalendarDate.create(row.date);
    if (!date.ok) return date;
    const nutrients = toNutrients(row);
    if (!nutrients.ok) return nutrients;
    days.push({ date: date.value, nutrients: nutrients.value, entryCount: row.entryCount });
  }
  return ok(DiaryMonth.of({ month: month.value, days, goals: goals.value }));
};
