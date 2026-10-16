import type { MealSlotType } from '@domain/diary/meal-slot';
import type { PlanWeekStepType } from '@presentation/app/diary/model/plan/plan-week-step';
import type { ProposalRow } from '@presentation/app/diary/model/plan/proposal-row';

export interface UsePlanMyWeekResult {
  visible: boolean;
  step: PlanWeekStepType;
  meals: ReadonlySet<MealSlotType>;
  loading: boolean;
  /** No saved, liked or own recipes at all: the sheet shows its empty state. */
  emptyPool: boolean;
  /** The proposal's days, each with its open meals, today onwards. */
  days: readonly { readonly key: string; readonly label: string; readonly rows: readonly ProposalRow[] }[];
  addCount: number;
  adding: boolean;
  open: () => void;
  close: () => void;
  toggleMeal: (meal: MealSlotType) => void;
  showPlan: () => void;
  change: () => void;
  shuffle: () => void;
  toggleSwap: (key: string) => void;
  add: () => void;
}
