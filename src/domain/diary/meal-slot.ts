/**
 * Which meal of the day a food-diary entry belongs to.
 *
 * @remarks
 * - **Declaration order is display order.** A day lists its meals by
 *   `Object.values(MealSlot)`, so reordering these reorders the Diary screen.
 * - **Not the wire values.** The backend speaks its Prisma enum
 *   (`BREAKFAST` … `SNACK`); infrastructure translates at the boundary.
 */
export const MealSlot = {
  Breakfast: 'breakfast',
  Lunch: 'lunch',
  Dinner: 'dinner',
  Snacks: 'snacks',
} as const;

export type MealSlotType = (typeof MealSlot)[keyof typeof MealSlot];
