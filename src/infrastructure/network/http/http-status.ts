/**
 * HTTP status boundaries this client actually branches on.
 *
 * `status >= 200 && status < 300` is the 2xx test written as arithmetic. It is
 * correct but silent about what it means, and it appeared in two transports
 * (the JSON client and the multipart uploader) with no shared definition — so
 * a change to one could not be applied to the other by searching for it.
 */
export const HttpStatus = {
  /** First success code; the 2xx range starts here. */
  successMin: 200,
  /** First redirect code — one past the end of the 2xx range. */
  successMax: 300,
} as const;

/** True for any 2xx. The single definition of "the request worked". */
export const isSuccessStatus = (status: number): boolean =>
  status >= HttpStatus.successMin && status < HttpStatus.successMax;
