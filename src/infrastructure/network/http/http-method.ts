/** The HTTP verbs this client issues. */
export const HttpMethod = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

/**
 * The verbs that carry a request body, and therefore the ones whose payload is
 * encrypted before it leaves. Derived from the list above so adding a verb
 * cannot leave this behind.
 */
export const METHODS_WITH_BODY: readonly HttpMethod[] = [
  HttpMethod.Post,
  HttpMethod.Put,
  HttpMethod.Patch,
];
