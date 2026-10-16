import type { PlannedRecipeDto } from '@infrastructure/meal-plan/dtos/planned-recipe-dto';

// GET /me/meal-plan/suggestion (recipely-backend #419).
export interface WeekSuggestionDto {
  weekStart: string;
  poolSize: number;
  slots: { date: string; meal: string; pick: PlannedRecipeDto | null; alternative: PlannedRecipeDto | null }[];
}
