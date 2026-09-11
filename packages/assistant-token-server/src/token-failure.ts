import type { TokenFailureCodeType } from './token-failure-code';

/** A failed mint. `detail` is diagnostic text for server logs — never send it to a client. */
export interface TokenFailure {
  readonly code: TokenFailureCodeType;
  readonly status?: number;
  readonly detail?: string;
}
