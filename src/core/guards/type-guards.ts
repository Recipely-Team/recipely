/**
 * The narrowing questions this app asks about values it did not create —
 * response bodies, decoded JWT payloads, platform globals.
 *
 * @remarks
 * - **They replace `typeof x === 'object' && x !== null`**, written out at every
 *   parse site. The pair matters: `typeof null` is `'object'`, so the first half
 *   alone is a bug waiting for a null body, and it is exactly the half a reader
 *   skims past.
 * - **`isObject` narrows to an indexable record**, so a caller can read a key
 *   without a second cast — the casts were how `body as Envelope` ended up
 *   asserting a shape before it had been checked.
 */
export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isString = (value: unknown): value is string => typeof value === 'string';

/** True for a string with something in it — the check a required field needs. */
export const isNonEmptyString = (value: unknown): value is string =>
  isString(value) && value.length > 0;

/** True when `value` is an object carrying `key`, narrowed so the key can be read. */
export const hasKey = <K extends string>(
  value: unknown,
  key: K,
): value is Record<K, unknown> => isObject(value) && key in value;

/**
 * True for a multipart body. Guarded on the global too: `FormData` does not
 * exist in every runtime the code is parsed in (SSR of the web export), and an
 * `instanceof` against a missing global throws rather than returning false.
 */
export const isFormData = (value: unknown): boolean =>
  typeof FormData !== 'undefined' && value instanceof FormData;

/**
 * `{ ...optional('bio', dto.bio) }` — the key appears only when the value does.
 *
 * `exactOptionalPropertyTypes` is on, so an optional field cannot simply be
 * assigned `undefined`; every mapper was spelling the conditional spread out by
 * hand, which put the field name in the object twice and read as a puzzle
 * rather than as "this one is optional".
 */
export const optional = <K extends string, T>(
  key: K,
  value: T | undefined | null | '',
): Partial<Record<K, T>> => (value ? ({ [key]: value } as Record<K, T>) : {});
