import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import { CalorieStatus } from '@domain/diary/nutrition/calorie-status';
import { DiaryDay } from '@domain/diary/day/diary-day';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import { NetworkFailure } from '@core/failure';
import { StoreStatus } from '@application/store/store-status';
import { LocaleConstants } from '@application/i18n/locale-constants';
import { setLocale } from '@presentation/i18n';
import { statusMarkerFor } from '@presentation/app/diary/shared/model/status-marker-for';
import { StatusMarkerKind } from '@presentation/app/diary/shared/model/status-marker-kind';
import { dayA11yLabel } from '@presentation/app/diary/shared/model/day-a11y-label';
import { monthGridCells } from '@presentation/app/diary/shared/model/month-grid-cells';
import { chunkWeeks } from '@presentation/app/diary/shared/model/chunk-weeks';
import { canPageToNextWeek } from '@presentation/app/diary/model/week-bounds';
import { toDiaryDayView } from '@presentation/app/diary/model/to-diary-day-view';

describe('diary status look', () => {
  afterEach(() => setLocale(LocaleConstants.en));

  it('gives every logged status its own shape and an unlogged day none', () => {
    expect(statusMarkerFor(CalorieStatus.None)).toBeNull();
    expect(statusMarkerFor(CalorieStatus.Under)).toBe(StatusMarkerKind.HollowCircle);
    expect(statusMarkerFor(CalorieStatus.On)).toBe(StatusMarkerKind.Check);
    expect(statusMarkerFor(CalorieStatus.Over)).toBe(StatusMarkerKind.Triangle);
    expect(statusMarkerFor(CalorieStatus.Far)).toBe(StatusMarkerKind.DoubleChevron);
  });

  it('speaks the kcal and the status in words, Turkish numbers included', () => {
    setLocale(LocaleConstants.tr);
    const label = dayA11yLabel(CalendarDate.of(2026, 9, 27), 2269, CalorieStatus.Over, 'tr');
    expect(label).toContain('2.269 kcal');
    expect(label).toContain('Hedefin üstünde');
    expect(dayA11yLabel(CalendarDate.of(2026, 9, 27), 0, CalorieStatus.None, 'tr')).toContain('Kayıt yok');
  });
});

describe('diary calendar layout', () => {
  it('pads a Monday-first grid and fills whole weeks', () => {
    const cells = monthGridCells(CalendarMonth.of(CalendarDate.of(2026, 9, 1)));
    expect(cells[0]).toBeNull(); // 1 September 2026 is a Tuesday
    expect(cells[1]?.value).toBe('2026-09-01');
    const rows = chunkWeeks(cells);
    expect(rows.every((row) => row.length === 7)).toBe(true);
    expect(rows.flat().filter((cell) => cell !== null)).toHaveLength(30);
  });

  it('pages no further than the week holding today', () => {
    const today = CalendarDate.of(2026, 9, 30);
    expect(canPageToNextWeek(today, today)).toBe(false);
    expect(canPageToNextWeek(today.addDays(-7), today)).toBe(true);
  });
});

describe('toDiaryDayView', () => {
  const day = DiaryDay.empty(CalendarDate.of(2026, 9, 30), NutritionGoals.defaults());
  const failure = new NetworkFailure('offline');

  it('shows a cached day even when its refresh failed', () => {
    expect(toDiaryDayView(day, failure).status).toBe(StoreStatus.Loaded);
  });
  it('is an error only for a day never loaded, and loading otherwise', () => {
    expect(toDiaryDayView(undefined, failure).status).toBe(StoreStatus.Error);
    expect(toDiaryDayView(undefined, null).status).toBe(StoreStatus.Loading);
  });
});
