/** The two steps of "Plan my week": which meals to fill, then the proposal. */
export const PlanWeekStep = {
  Meals: 'meals',
  Proposal: 'proposal',
} as const;

export type PlanWeekStepType = (typeof PlanWeekStep)[keyof typeof PlanWeekStep];
