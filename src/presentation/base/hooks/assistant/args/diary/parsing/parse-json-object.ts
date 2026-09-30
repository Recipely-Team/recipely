import { isObject } from '@core/guards/type-guards';

const OBJECT_START = '{';

/**
 * A JSON-object arg as a record; `undefined` when the arg is not JSON at all
 * (a plain name), `null` when it starts like JSON and is broken.
 */
export const parseJsonObject = (arg: string): Record<string, unknown> | null | undefined => {
  const trimmed = arg.trim();
  if (!trimmed.startsWith(OBJECT_START)) return undefined;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
