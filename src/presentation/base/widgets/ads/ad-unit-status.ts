/**
 * AdSense's verdict on a display unit, as it writes it onto the `<ins>`.
 *
 * @remarks
 * - **Two states plus absent.** AdSense sets `data-ad-status` to `filled` or
 *   `unfilled` once it has decided, and sets nothing at all before that. The
 *   third state has no member here on purpose: "has not decided" is the
 *   absence of a value, and giving it a name would invite code to treat it as
 *   an answer.
 * - **One definition, two readers.** The reader turns the attribute into this
 *   vocabulary and `WebBannerAd` discriminates on it — the string used to be
 *   spelled at both ends (CLAUDE.md rule 5).
 */
export const AdUnitStatus = {
  Filled: 'filled',
  Unfilled: 'unfilled',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type AdUnitStatus = (typeof AdUnitStatus)[keyof typeof AdUnitStatus];
