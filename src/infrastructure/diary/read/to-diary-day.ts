import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { ValidationFailure } from '@core/failure';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { DiaryDay } from '@domain/diary/day/diary-day';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { DiaryDayDto } from '@infrastructure/diary/dtos/diary-day-dto';
import { toFoodLogEntry } from '@infrastructure/diary/read/to-food-log-entry';
import { toNutritionGoals } from '@infrastructure/diary/read/to-nutrition-goals';

/**
 * `GET /diary/days/:date` → `DiaryDay`. One malformed entry fails the whole
 * day rather than being dropped: a silently missing food would make the
 * day's totals lie.
 */
export const toDiaryDay: Mapper<DiaryDayDto, DiaryDay, ValidationFailure> = (dto) => {
  const date = CalendarDate.create(dto.date);
  if (!date.ok) return date;
  const goals = toNutritionGoals(dto.goals);
  if (!goals.ok) return goals;
  const entries: FoodLogEntryEntity[] = [];
  for (const item of dto.entries) {
    const entry = toFoodLogEntry(item);
    if (!entry.ok) return entry;
    entries.push(entry.value);
  }
  return ok(DiaryDay.of({ date: date.value, entries, waterGlasses: dto.waterGlasses, goals: goals.value }));
};
