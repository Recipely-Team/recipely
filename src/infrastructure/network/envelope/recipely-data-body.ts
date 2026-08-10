/**
 * What every successful `/api/v1` response looks like once decrypted: the
 * payload under a single `data` key.
 *
 * @remarks
 * - **The wrapper is the contract, not decoration.** The backend's
 *   `decryptBody` middleware reads `{ data: … }` on the way in and writes it on
 *   the way out, so a repository that unwraps by hand is duplicating a rule
 *   that belongs here.
 * - **Errors do not use this shape.** A non-2xx carries `{ error: … }` instead;
 *   see `failure-from-response.ts`, which is the only place that reads it.
 */
export interface RecipelyDataBody<T> {
  data: T;
}
