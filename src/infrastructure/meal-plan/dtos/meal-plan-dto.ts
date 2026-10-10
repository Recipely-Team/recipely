import type { MealPlanEntryDto } from '@infrastructure/meal-plan/dtos/meal-plan-entry-dto';

// `GET /me/meal-plan?from&to` — sorted by date, meal, position.
export interface MealPlanDto {
  from: string;
  to: string;
  entries: MealPlanEntryDto[];
}
