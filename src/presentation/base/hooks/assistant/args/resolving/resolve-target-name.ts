import { CharConstants } from '@core/constants';
import { machineLower } from '@presentation/base/hooks/assistant/args/resolving/machine-case';

/** Local: only target names are folded this way. */
const TARGET_NAME_SEPARATORS = /[\s_-]+/g;

/**
 * A machine key with case and separators folded away, so "My Recipes",
 * "my_recipes" and "myRecipes" are one name.
 *
 * @remarks
 * The model is given the keys and is not held to them. Measured on production:
 * asked "open my recipes" through Siri, the Groq fallback answered `navigate`
 * with `My Recipes` — the label, not the key — and the app came forward to a
 * screen it then refused as `unknown_screen`. Every argument that names an
 * ASCII camelCase key goes through here: screens, outside pages, draft fields,
 * preference keys, sort keys. Folding case and separators must not make two keys
 * in one set collide — `find` would quietly pick the first; tests hold it for
 * screens, outside pages against screens, and sort keys.
 */
export const foldTargetName = (value: string): string =>
  machineLower(value).replace(TARGET_NAME_SEPARATORS, CharConstants.empty);

/** The one of `names` a spoken word means, however it was cased or spaced; `null` when none. */
export const resolveTargetName = <T extends string>(value: string, names: readonly T[]): T | null => {
  const wanted = foldTargetName(value);
  return names.find((name) => foldTargetName(name) === wanted) ?? null;
};
