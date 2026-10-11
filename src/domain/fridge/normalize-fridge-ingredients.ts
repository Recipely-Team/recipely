import { CharConstants, ValueConstants } from '@core/constants';
import { FridgeLimits } from '@domain/fridge/fridge-limits';

const WHITESPACE_RUN = /\s+/g;

/**
 * **The ingredient list as the server accepts it** — every name trimmed, inner
 * whitespace collapsed and cut to `FridgeLimits.ingredientNameMax`; blanks
 * dropped; duplicates (ignoring case) kept once, first spelling wins; at most
 * `FridgeLimits.ingredientsMax` names.
 *
 * @remarks
 * - **One rule for scanned and typed names**, so "Eggs" typed after a scan
 *   found "eggs" does not ask the AI about the same thing twice.
 */
export const normalizeFridgeIngredients = (names: readonly string[]): string[] => {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const raw of names) {
    const name = raw.replace(WHITESPACE_RUN, CharConstants.space).trim().slice(ValueConstants.zero, FridgeLimits.ingredientNameMax).trim();
    const key = name.toLowerCase();
    if (name.length === ValueConstants.zero || seen.has(key)) continue;
    seen.add(key);
    kept.push(name);
    if (kept.length === FridgeLimits.ingredientsMax) break;
  }
  return kept;
};
