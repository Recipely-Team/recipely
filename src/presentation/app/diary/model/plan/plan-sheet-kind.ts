/** Which of the Plan view's sheets is open; the add sheet has its own request. */
export const PlanSheetKind = {
  None: 'none',
  MealActions: 'mealActions',
  Move: 'move',
  WeekMenu: 'weekMenu',
  ClearWeek: 'clearWeek',
  Shopping: 'shopping',
} as const;
