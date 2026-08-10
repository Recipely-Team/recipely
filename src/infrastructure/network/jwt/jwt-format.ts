/**
 * Shape of a JWT on the wire, as RFC 7519 defines it.
 *
 * These are protocol facts, not tuning knobs — a token has three
 * dot-separated segments and the claims are the middle one. Written down so
 * `parts.length !== 3` and `parts[1]` stop being numbers a reader has to
 * recognise, and so the base64url alphabet swap says which direction it goes.
 */
export const JwtFormat = {
  /** header.payload.signature */
  segmentCount: 3,
  separator: '.',
  /** Index of the claims segment. */
  payloadIndex: 1,
} as const;

/**
 * base64url differs from base64 in two characters and in dropping the
 * padding; `atob` only understands base64, so both are undone before decoding.
 */
export const Base64Url = {
  /** base64url -> base64: `-` becomes `+`, `_` becomes `/`. */
  minusToPlus: /-/g,
  underscoreToSlash: /_/g,
  plus: '+',
  slash: '/',
  /** base64 is decoded in four-character blocks, padded with `=`. */
  blockSize: 4,
  padding: '=',
} as const;
