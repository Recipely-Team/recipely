import { decodeJwtPayload } from '@infrastructure/network/jwt/decode-jwt';
import { JwtClaim } from '@infrastructure/network/jwt/jwt-claim';
import { TimeConstants } from '@core/constants';

const FALLBACK_EXPIRES_MS = 3_600_000;

/**
 * Derives the session expiry from a JWT's `exp` claim, falling back to one hour
 * from now when the token is unparseable or omits `exp`.
 */
export const expiresAtFromToken = (token: string): Date => {
  const claims = decodeJwtPayload(token);
  const expiresAt = claims.ok ? claims.value[JwtClaim.expiresAt] : undefined;
  if (typeof expiresAt === 'number') {
    // `exp` is a Unix time in SECONDS; `Date` wants milliseconds.
    return new Date(expiresAt * TimeConstants.millisecondsPerSecond);
  }
  return new Date(Date.now() + FALLBACK_EXPIRES_MS);
};
