import type { FoodLogEntryDto } from '@infrastructure/diary/dtos/food-log-entry-dto';
import type { NutrientTotalsDto } from '@infrastructure/diary/dtos/nutrient-totals-dto';
import type { NutritionGoalsDto } from '@infrastructure/diary/dtos/nutrition-goals-dto';

// `GET /diary/days/:date`.
export interface DiaryDayDto {
  date: string;
  entries: FoodLogEntryDto[];
  waterGlasses: number;
  totals: NutrientTotalsDto;
  goals: NutritionGoalsDto;
}
