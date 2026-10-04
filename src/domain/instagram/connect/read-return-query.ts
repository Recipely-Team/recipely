import { CharConstants, ValueConstants } from '@core/constants';

const QUERY = '?';
const PAIR = '&';
const EQUALS = '=';
const FRAGMENT = '#';
const PLUS = '+';

/** The query of a return URL (`recipely://instagram-connected?status=…&code=…`) as name → value. */
export const readReturnQuery = (url: string): Record<string, string> => {
  const start = url.indexOf(QUERY);
  if (start < ValueConstants.zero) return {};
  const query = url.slice(start + QUERY.length).split(FRAGMENT)[ValueConstants.zero] ?? CharConstants.empty;
  const params: Record<string, string> = {};
  for (const pair of query.split(PAIR)) {
    const [name, value = CharConstants.empty] = pair.split(EQUALS);
    if (name !== undefined && name.length > ValueConstants.zero) params[decodeURIComponent(name)] = decodeURIComponent(value.split(PLUS).join(CharConstants.space));
  }
  return params;
};
