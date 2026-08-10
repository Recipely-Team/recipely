/**
 * Number bases and the widths that go with them.
 *
 * `toString(16)` and `parseInt(x, 16)` are hex conversions; the bare `16` says
 * nothing, and a `2` beside it is not "two of something" but the number of hex
 * characters one byte occupies. Both are spelled out here so a reader does not
 * have to recognise the idiom to follow the code.
 */
export const RadixConstants = {
  hex: 16,
  /** A byte is two hex characters — the pad width for `toString(16)`. */
  hexCharsPerByte: 2,
} as const;
