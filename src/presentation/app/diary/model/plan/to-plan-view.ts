import { StoreStatus } from '@application/store/store-status';
import type { MealPlanWeekState } from '@application/meal-plan/meal-plan-week-state';
import { PlanViewKind } from '@presentation/app/diary/model/plan/plan-view-kind';
import type { PlanView } from '@presentation/app/diary/model/plan/plan-view';

/** The store's week (absent until asked for) → what the Plan view renders. A guest sees the sign-in card, whatever is cached. */
export const toPlanView = (signedIn: boolean, state: MealPlanWeekState | undefined): PlanView => {
  if (!signedIn) return { kind: PlanViewKind.SignedOut };
  if (state === undefined || state.status === StoreStatus.Idle || state.status === StoreStatus.Loading) return { kind: PlanViewKind.Loading };
  if (state.status === StoreStatus.Error) return { kind: PlanViewKind.Error, failure: state.failure };
  return { kind: PlanViewKind.Week, week: state.week };
};
