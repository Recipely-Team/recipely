import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import type { PlanSheetKind } from '@presentation/app/diary/model/plan/plan-sheet-kind';

/** The open Plan sheet; the meal sheets carry the meal they act on. */
export type PlanSheet =
  | { kind: typeof PlanSheetKind.None }
  | { kind: typeof PlanSheetKind.MealActions; entry: MealPlanEntryEntity }
  | { kind: typeof PlanSheetKind.Move; entry: MealPlanEntryEntity }
  | { kind: typeof PlanSheetKind.WeekMenu }
  | { kind: typeof PlanSheetKind.ClearWeek }
  | { kind: typeof PlanSheetKind.Shopping };
