/** The two faces of the Add food sheet. */
export const AddFoodStep = {
  Pick: 'pick',
  Detail: 'detail',
} as const;

export type AddFoodStepType = (typeof AddFoodStep)[keyof typeof AddFoodStep];
