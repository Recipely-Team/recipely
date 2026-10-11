import type { Failure } from '@core/failure';
import type { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';
import type { PlanViewKind } from '@presentation/app/diary/model/plan/plan-view-kind';

/** The Plan view's state; an empty week is a `Week` whose `week.isEmpty` is true. */
export type PlanView =
  | { kind: typeof PlanViewKind.SignedOut }
  | { kind: typeof PlanViewKind.Loading }
  | { kind: typeof PlanViewKind.Error; failure: Failure }
  | { kind: typeof PlanViewKind.Week; week: MealPlanWeek };
