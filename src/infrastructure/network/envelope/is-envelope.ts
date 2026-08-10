import type { Envelope } from '@infrastructure/crypto/envelope';
import { isObject, isString } from '@core/guards/type-guards';

/** Narrows an arbitrary response body to an AES-GCM `Envelope`. */
export const isEnvelope = (body: unknown): body is Envelope =>
  isObject(body) && isString(body.payload) && isString(body.iv);
