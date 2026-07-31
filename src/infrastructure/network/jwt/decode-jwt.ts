import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import type { JwtClaims } from '@infrastructure/network/jwt/jwt-claims';
import { CharConstants, RadixConstants, ValueConstants } from '@core/constants';

/** Pad character for a single-digit hex byte. */
const HEX_PAD = '0';

// WHY: avoid pulling in a dep (jwt-decode) just to split and base64-parse the payload.
// We never verify signature on-device — the backend does that on every authed request.
export const decodeJwtPayload = (token: string): Result<JwtClaims, ValidationFailure> => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return fail(new ValidationFailure('Malformed JWT', 'token'));
  }
  const payloadB64 = parts[1];
  if (!payloadB64) {
    return fail(new ValidationFailure('Malformed JWT', 'token'));
  }
  try {
    const json = base64UrlDecode(payloadB64);
    const parsed = JSON.parse(json) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return fail(new ValidationFailure('JWT payload is not an object', 'token'));
    }
    return ok(parsed as JwtClaims);
  } catch {
    return fail(new ValidationFailure('Could not decode JWT payload', 'token'));
  }
};

// base64url → base64 → atob → utf-8 string. Hermes ships `atob` in RN 0.71+.
const base64UrlDecode = (input: string): string => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
   
  const binary = atob(padded);
  let out = CharConstants.empty;
  for (let i = ValueConstants.zero; i < binary.length; i++) {
    out += `%${binary.charCodeAt(i).toString(RadixConstants.hex).padStart(RadixConstants.hexCharsPerByte, HEX_PAD)}`;
  }
  return decodeURIComponent(out);
};
