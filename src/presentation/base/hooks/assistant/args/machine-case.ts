/**
 * Case-folds a value that is compared against a MACHINE constant.
 *
 * @remarks
 * Locale-aware casing is wrong here, and wrong in the app's primary locale
 * first: on a Turkish device `'medium'.toLocaleUpperCase()` is `MEDİUM` — a
 * dotted capital I — which never equals `Difficulty.MEDIUM`, and
 * `'Italian'.toLocaleLowerCase()` is `ıtalian`, which never equals the
 * taxonomy key `italian`. Every difficulty and every filter the assistant set
 * would have failed on exactly the devices this app is built for.
 *
 * Row text a person reads is the opposite case and keeps `toLocale*`: matching
 * "yoğurt" against what the screen shows is a human comparison, and the
 * locale's rules are the right ones there.
 */
export const machineLower = (value: string): string => value.trim().toLowerCase();

export const machineUpper = (value: string): string => value.trim().toUpperCase();
