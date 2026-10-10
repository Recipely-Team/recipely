/** Whether "Cook from my fridge" may be offered: not asked yet, on, or off (rule 23g). */
export const FridgeAvailability = {
  Unknown: 'unknown',
  On: 'on',
  Off: 'off',
} as const;

export type FridgeAvailabilityType = (typeof FridgeAvailability)[keyof typeof FridgeAvailability];
