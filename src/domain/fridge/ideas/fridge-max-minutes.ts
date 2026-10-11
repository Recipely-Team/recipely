/** The time caps an ideas request may ask for, in minutes — the backend accepts exactly these. */
export const FridgeMaxMinutes = {
  Quick: 15,
  Half: 30,
  Hour: 60,
} as const;

export type FridgeMaxMinutesType = (typeof FridgeMaxMinutes)[keyof typeof FridgeMaxMinutes];
