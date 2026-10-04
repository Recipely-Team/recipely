/**
 * The meal names on the wire — the backend's Prisma `MealSlot` enum. Kept
 * apart from the domain's `MealSlot` so a rename on either side is one edit in
 * `to-meal-slot` / `to-meal-slot-wire`, not a hunt.
 */
export const MealSlotWire = {
  Breakfast: 'BREAKFAST',
  Lunch: 'LUNCH',
  Dinner: 'DINNER',
  Snack: 'SNACK',
} as const;

export type MealSlotWireType = (typeof MealSlotWire)[keyof typeof MealSlotWire];
