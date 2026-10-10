import type { PlannedRecipeDto } from '@infrastructure/meal-plan/dtos/planned-recipe-dto';

// One planned meal: `POST /entries`, `PATCH /entries/:id`, `POST|DELETE /entries/:id/eaten`, and each row of `GET /`.
export interface MealPlanEntryDto {
  id: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** `BREAKFAST` | `LUNCH` | `DINNER` | `SNACK`. */
  meal: string;
  position: number;
  servings: number;
  eaten: boolean;
  foodLogEntryId: string | null;
  recipe: PlannedRecipeDto;
}
