import { CharConstants, RegexConstants } from '@core/constants';

/**
 * Resolves a request URL against a base.
 *
 * An absolute URL is already complete and passes through untouched — the AI
 * and legal endpoints are given in full. A relative one is joined to the base
 * with exactly one separator, whether or not the caller wrote a leading slash.
 * That last bit is why this is a function and not a template literal at the
 * call site: `${base}${path}` silently produces `…netrecipes` for a path
 * without a slash, and `${base}/${path}` produces `…net//recipes` for one
 * with. Both were being spelled out per transport.
 */
export const joinUrl = (baseUrl: string, url: string): string => {
  if (RegexConstants.absoluteHttpUrl.test(url)) return url;
  const path = url.startsWith(CharConstants.slash) ? url : `${CharConstants.slash}${url}`;
  return `${baseUrl}${path}`;
};
