import type { Envelope } from '@infrastructure/crypto/envelope';

/** Narrows an arbitrary response body to an AES-GCM `Envelope`. */
export const isEnvelope = (body: unknown): body is Envelope => {
  return (
    typeof body === 'object' && // TO DO: static type check problem
    body !== null &&
    typeof (body as Envelope).payload === 'string' && // TO DO: static type check problem
    typeof (body as Envelope).iv === 'string' // TO DO: static type check problem
  );
};
