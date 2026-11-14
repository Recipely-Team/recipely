import { CharConstants } from '@core/constants';
import { FridgeDiet } from '@domain/fridge/ideas/fridge-diet';
import { FridgeMaxMinutes, type FridgeMaxMinutesType } from '@domain/fridge/ideas/fridge-max-minutes';
import { FridgeLimits } from '@domain/fridge/fridge-limits';
import type { FridgeFilters } from '@presentation/app/fridge/model/filters/fridge-filters';

/** The filter names the assistant says: `time=15`, `diet=vegan`, `servings=4`. */
const FridgeVoiceFilterKey = { time: 'time', diet: 'diet', servings: 'servings' } as const;
/** "No time limit" / "no diet". */
const ANY = 'any';
const DECIMAL = 10;
/** Dashes and spaces a spoken value may carry: `high-protein`, `high protein`. */
const SEPARATORS = /[\s-]/g;
const fold = (word: string): string => word.replace(SEPARATORS, CharConstants.empty).toLowerCase();

const MINUTES: readonly number[] = Object.values(FridgeMaxMinutes);
const DIETS: readonly string[] = Object.values(FridgeDiet);

/**
 * One spoken filter as a change to the fridge filters, or null when the key or
 * value is not one the screen offers (the caller answers `unknown_filter`).
 */
export const fridgeFilterFromVoice = (key: string, value: string): Partial<FridgeFilters> | null => {
  const said = value.trim();
  switch (key.trim().toLowerCase()) {
    case FridgeVoiceFilterKey.time: {
      if (said.toLowerCase() === ANY) return { maxMinutes: null };
      const minutes = Number.parseInt(said, DECIMAL);
      return MINUTES.includes(minutes) ? { maxMinutes: minutes as FridgeMaxMinutesType } : null;
    }
    case FridgeVoiceFilterKey.diet: {
      const diet = said.toLowerCase() === ANY ? FridgeDiet.None : DIETS.find((d) => fold(d) === fold(said));
      return diet === undefined ? null : { diet: diet as FridgeFilters['diet'] };
    }
    case FridgeVoiceFilterKey.servings: {
      const servings = Number.parseInt(said, DECIMAL);
      return servings >= FridgeLimits.servingsMin && servings <= FridgeLimits.servingsMax ? { servings } : null;
    }
    default:
      return null;
  }
};
