import { CharConstants, ValueConstants } from '@core/constants';
import { InstagramReturnKind } from '@domain/instagram/connect/instagram-return-kind';
import type { InstagramReturnType } from '@domain/instagram/connect/instagram-return';

const STATUS_AUTHORIZED = 'authorized';
const STATUS_ERROR = 'error';
const REASON_DENIED = 'denied';

/** The return link's query, by name — from a URL or the router's params. */
type ReturnParams = Readonly<Record<string, string | undefined>>;

/**
 * Reads the return link the server redirected to (`?status=authorized&code=…`
 * or `?status=error&reason=denied|failed`, backend #374). A link without a
 * usable status or code is a failed login, never a silent success.
 */
export const readInstagramReturn = (params: ReturnParams): InstagramReturnType => {
  const code = params.code?.trim() ?? CharConstants.empty;
  if (params.status === STATUS_AUTHORIZED && code.length > ValueConstants.zero) return { kind: InstagramReturnKind.Authorized, code };
  if (params.status === STATUS_ERROR && params.reason === REASON_DENIED) return { kind: InstagramReturnKind.Denied };
  return { kind: InstagramReturnKind.Failed };
};
