import { CharConstants } from '@core/constants';
import { machineLower } from '@presentation/base/hooks/assistant/args/resolving/machine-case';

/**
 * A target key with case and separators folded away, so "My Recipes",
 * "my_recipes" and "myRecipes" are one name.
 *
 * @remarks
 * The model is given the keys and is not held to them. Measured on production:
 * asked "open my recipes" through Siri, the Groq fallback answered
 * `navigate` with `My Recipes` — the label, not the key — and the app came
 * forward to a screen it then refused as `unknown_screen`. The keys are ASCII
 * camelCase by construction, so folding case and separators cannot make two of
 * them collide (a test holds that).
 */
export const foldTargetName = (value: string): string =>
  machineLower(value).replace(TARGET_NAME_SEPARATORS, CharConstants.empty);

/** Local: only target names are folded this way. */
const TARGET_NAME_SEPARATORS = /[\s_-]+/g;
