/**
 * The HTTP status codes and boundaries this client branches on.
 *
 * @remarks
 * - **The 2xx test used to be arithmetic in two places.** `status >= 200 &&
 *   status < 300` is correct but silent about what it means, and it appeared in
 *   both transports (the JSON client and the multipart uploader) with no shared
 *   definition — so a change to one could not be found from the other.
 * - **The named codes are the ones a response is mapped by.** They are here so
 *   the mapper and the uploader agree on what 401 means without either of them
 *   spelling the number out.
 */
export const HttpStatus = {
  /** First success code; the 2xx range starts here. */
  successMin: 200,
  /** First redirect code — one past the end of the 2xx range. */
  successMax: 300,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  tooManyRequests: 429,
  /** First client-error code — the 4xx range starts here. */
  clientErrorMin: 400,
  /** First server-error code — the 5xx range starts here. */
  serverErrorMin: 500,
} as const;

/** True for any 2xx. The single definition of "the request worked". */
export const isSuccessStatus = (status: number): boolean =>
  status >= HttpStatus.successMin && status < HttpStatus.successMax;

/**
 * Axios's own transport error codes — set on the error object, not by the
 * server. `ECONNABORTED` is what a client-side timeout arrives as, which is why
 * a slow endpoint without its own budget reads to the user as a network error.
 */
export const AxiosErrorCode = {
  timedOut: 'ECONNABORTED',
  connectionTimedOut: 'ETIMEDOUT',
} as const;
