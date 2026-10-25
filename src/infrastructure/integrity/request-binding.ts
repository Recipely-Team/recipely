import { CharConstants, ValueConstants } from '@core/constants';

/**
 * The string an attestation is bound to: verb, path and the request's own id.
 *
 * @remarks
 * - **The backend rebuilds it** from the request it received — `METHOD path`,
 *   a newline, `X-Request-Id` — so a proof cannot be lifted onto another call.
 * - **The request id makes it single-use**: the backend remembers the ids it
 *   accepted, so replaying a captured request with its proof is refused.
 * - **The path is the route, not the URL**: no host, no query string.
 */
export const requestBinding = (method: string, url: string, requestId: string): string => {
  const path = url.split(CharConstants.questionMark)[ValueConstants.zero] ?? CharConstants.empty;
  return `${method.toUpperCase()}${CharConstants.space}${path}${CharConstants.newline}${requestId}`;
};
