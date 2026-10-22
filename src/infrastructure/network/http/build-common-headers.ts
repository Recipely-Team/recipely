import type { AxiosHttpClientOptions } from '@infrastructure/network/http/axios-http-client-options';
import { HttpHeader, HttpMediaType, BEARER_PREFIX } from '@infrastructure/network/http/http-header';

/**
 * Builds the headers every backend request carries, regardless of transport:
 * the JWT bearer token and the active language. This is the ONE place the
 * request locale is read — the axios interceptor and the raw-XHR multipart
 * uploader both go through it, so a language switch can never be picked up by
 * one path and missed by the other.

 */
export const buildCommonHeaders = async (
  options: AxiosHttpClientOptions,
): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    [HttpHeader.acceptLanguage]: await options.localeProvider(),
  };
  if (options.cookieSession === true) {
    headers[HttpHeader.recipelySession] = HttpMediaType.cookieSession;
  }
  const token = await options.tokenProvider();
  if (token !== null) {
    headers[HttpHeader.authorization] = `${BEARER_PREFIX}${token}`;
  }
  return headers;
};
