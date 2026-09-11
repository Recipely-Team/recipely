/** Why a token could not be minted. The HTTP status and Google's message ride in `detail`, for logs. */
export const TokenFailureCode = {
  /** Google could not be reached, or did not answer within the timeout. */
  Unreachable: 'unreachable',
  /** Google refused the request: a bad key, an unknown model, a setup field it does not accept. */
  Rejected: 'rejected',
  /** Google answered, but not with a token. */
  Malformed: 'malformed',
} as const;

export type TokenFailureCodeType = (typeof TokenFailureCode)[keyof typeof TokenFailureCode];
