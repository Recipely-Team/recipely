/**
 * Languages that are fully TRANSLATED but not yet selectable.
 *
 * @remarks
 * A catalogue being complete is not the same as the app rendering it correctly.
 * Each of these carries a specific, unverified rendering risk, so they are shown
 * in the picker as "coming soon" rather than quietly offered and then read
 * badly — and `toSupportedLocale` never resolves to one, so a device set to
 * Arabic gets English instead of a mirrored-wrong interface.
 *
 * - **`ar`** — right-to-left. The app has no RTL layout at all: every row,
 *   padding and chevron would point the wrong way. This is a real blocker, not
 *   a caution.
 * - **`hi`** — Devanagari stacks matras above and below the baseline, so line
 *   boxes are taller than Latin ones and clip in anything that pinned a height.
 * - **`zh` / `ja` / `ko`** — CJK wraps between any two characters rather than at
 *   spaces, and leans on font fallback that differs per platform. Probably fine;
 *   nobody has looked at it on a device.
 *
 * Moving one to `LocaleConstants` is the whole job of enabling it — do that once
 * someone has actually read a few screens in it.
 */
export const PREVIEW_LOCALES: readonly string[] = ['ar', 'hi', 'zh', 'ja', 'ko'];
