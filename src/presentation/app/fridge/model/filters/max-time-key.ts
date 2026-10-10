import { FridgeMaxMinutes, type FridgeMaxMinutesType } from '@domain/fridge/ideas/fridge-max-minutes';

const ANY = 'any';

/** The max-time segments' keys ("any" plus each cap as text) — `SegmentedTabs` keys are strings. */
export const MaxTimeKey = {
  Any: ANY,
  /** A segment key → the cap it stands for (null: any time). */
  toMinutes: (key: string): FridgeMaxMinutesType | null =>
    Object.values(FridgeMaxMinutes).find((minutes) => String(minutes) === key) ?? null,
  /** A cap → its segment key. */
  of: (minutes: FridgeMaxMinutesType | null): string => (minutes === null ? ANY : String(minutes)),
} as const;
