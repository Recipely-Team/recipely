import type { AxiosHttpClientOptions } from '@infrastructure/network/http/axios-http-client-options';
import { HttpHeader, HttpMediaType, BEARER_PREFIX } from '@infrastructure/network/http/http-header';
import { ATTESTED_ROUTES } from '@infrastructure/constants/api/attested-routes';
import { requestBinding } from '@infrastructure/integrity/request-binding';
import { boundedAttestation } from '@infrastructure/integrity/bounded-attestation';

/** The verb and route a header set is for; only attestation reads it. */
interface OutgoingRequest {
  method: string;
  url: string;
}

/**
 * Builds the headers every backend request carries, regardless of transport:
 * the JWT bearer token, the active language and, on a store build, its
 * platform and version. This is the ONE place the
 * request locale is read — the axios interceptor and the raw-XHR multipart
 * uploader both go through it, so a language switch can never be picked up by
 * one path and missed by the other.
 *
 * An `ATTESTED_ROUTES` request also gets its attestation headers, bound to its
 * verb, path and request id — or none, if the proof fails or is slow.
 */
export const buildCommonHeaders = async (
  options: AxiosHttpClientOptions,
  request?: OutgoingRequest,
): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    [HttpHeader.acceptLanguage]: await options.localeProvider(),
  };
  if (options.requestIdProvider !== undefined) {
    const requestId = options.requestIdProvider();
    headers[HttpHeader.requestId] = requestId;
    if (request !== undefined && options.attestationProvider !== undefined && ATTESTED_ROUTES.has(request.url)) {
      const binding = requestBinding(request.method, request.url, requestId);
      Object.assign(headers, await boundedAttestation(options.attestationProvider, binding));
    }
  }
  if (options.appBuild !== undefined) {
    headers[HttpHeader.appPlatform] = options.appBuild.platform;
    headers[HttpHeader.appVersion] = options.appBuild.version;
  }
  if (options.cookieSession === true) {
    headers[HttpHeader.recipelySession] = HttpMediaType.cookieSession;
  }
  const token = await options.tokenProvider();
  if (token !== null) {
    headers[HttpHeader.authorization] = `${BEARER_PREFIX}${token}`;
  }
  return headers;
};
