import type { DiaryMonthDayDto } from '@infrastructure/diary/dtos/diary-month-day-dto';
import type { NutritionGoalsDto } from '@infrastructure/diary/dtos/nutrition-goals-dto';

// `GET /diary/months/:month`.
export interface DiaryMonthDto {
  month: string;
  days: DiaryMonthDayDto[];
  goals: NutritionGoalsDto;
}
