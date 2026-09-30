import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { AddFoodRequest } from '@presentation/base/widgets/diary/add-food/request/add-food-request';

/** Which of the Day view's sheets is open, as `useDiarySheets` exposes it. */
export interface UseDiarySheetsResult {
  addRequest: AddFoodRequest | null;
  goalsOpen: boolean;
  /** Opens Add food on the pick step; `null` meal defaults from the clock. */
  openAdd: (meal: MealSlotType | null) => void;
  openEdit: (entry: FoodLogEntryEntity) => void;
  closeAdd: () => void;
  openGoals: () => void;
  closeGoals: () => void;
}
