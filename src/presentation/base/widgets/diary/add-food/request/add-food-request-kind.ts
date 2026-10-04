/** How the Add food sheet was opened — which step it starts on and what its footer does. */
export const AddFoodRequestKind = {
  /** From the diary: start on the pick step. */
  Pick: 'pick',
  /** With a food already chosen (a recipe from its detail page): start on the detail step. */
  Food: 'food',
  /** A logged entry was tapped: the detail step in edit mode, with Remove. */
  Edit: 'edit',
} as const;

export type AddFoodRequestKindType = (typeof AddFoodRequestKind)[keyof typeof AddFoodRequestKind];
