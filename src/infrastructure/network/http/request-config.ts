/**
 * The per-request knobs a caller may set — not the verb, url or body, which
 * are the arguments of `get` / `post` / `put` / `patch` / `delete`.
 *
 * Deliberately narrower than Axios' own config: a repository has no business
 * swapping the adapter or the status validator, and exposing the whole surface
 * invites call sites to rebuild the client's behaviour one request at a time.
 */
export interface RequestConfig {
  /**
   * Query string values, serialised by Axios. Typed as `object` rather than
   * `Record<string, unknown>` so a purpose-built query DTO — the shape a
   * `RequestMapper` produces — satisfies it without an index signature it has
   * no reason to carry.
   */
  params?: object;
  /** Overrides the client default — the AI and import calls need far longer. */
  timeout?: number;
}
