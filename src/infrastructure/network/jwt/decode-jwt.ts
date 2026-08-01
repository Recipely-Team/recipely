import { fail, ok } from '@core/result/result-helpers';
import { DiagnosticMessage, FailureField } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import type { JwtClaims } from '@infrastructure/network/jwt/jwt-claims';
import { Base64Url, JwtFormat } from '@infrastructure/network/jwt/jwt-format';
import { CharConstants, RadixConstants, ValueConstants } from '@core/constants';

/** Pad character for a single-digit hex byte. */
const HEX_PAD = '0';
/** `decodeURIComponent` reads each byte as a %XX escape. */
const PERCENT = '%';

// WHY: avoid pulling in a dep (jwt-decode) just to split and base64-parse the payload.
// We never verify signature on-device — the backend does that on every authed request.
export const decodeJwtPayload = (token: string): Result<JwtClaims, ValidationFailure> => {
  const parts = token.split(JwtFormat.separator);
  if (parts.length !== JwtFormat.segmentCount) {
    return fail(new ValidationFailure(DiagnosticMessage.jwt.malformed, FailureField.token));
  }
  const payloadB64 = parts[JwtFormat.payloadIndex];
  if (!payloadB64) {
    return fail(new ValidationFailure(DiagnosticMessage.jwt.malformed, FailureField.token));
  }
  try {
    const json = base64UrlDecode(payloadB64);
    const parsed = JSON.parse(json) as unknown;
    if (typeof parsed !== 'object' || parsed === null) { // TO DO: static type check for this object shape, single source of truth for the JWT payload
      return fail(new ValidationFailure(DiagnosticMessage.jwt.payloadNotAnObject, FailureField.token));
    }
    return ok(parsed as JwtClaims);
  } catch {
    return fail(new ValidationFailure(DiagnosticMessage.jwt.payloadUndecodable, FailureField.token));
  }
};

// base64url → base64 → atob → utf-8 string. Hermes ships `atob` in RN 0.71+.
const base64UrlDecode = (input: string): string => {
  const normalized = input
    .replace(Base64Url.minusToPlus, Base64Url.plus)
    .replace(Base64Url.underscoreToSlash, Base64Url.slash);
  const missing = (Base64Url.blockSize - (normalized.length % Base64Url.blockSize)) % Base64Url.blockSize;
  const padded = normalized + Base64Url.padding.repeat(missing);
   
  const binary = atob(padded);
  let out = CharConstants.empty;
  for (let i = ValueConstants.zero; i < binary.length; i++) {
    out += `${PERCENT}${binary.charCodeAt(i).toString(RadixConstants.hex).padStart(RadixConstants.hexCharsPerByte, HEX_PAD)}`;
  }
  return decodeURIComponent(out);
};
