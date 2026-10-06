/**
 * Cross-cutting regular expressions shared by more than one layer.
 *
 * Feature-local patterns (ingredient parsing, route matching) stay next to the
 * code that owns them; only patterns that would otherwise be re-declared —
 * and drift — live here.
 *
 * INVARIANT: no pattern here may carry the `g` or `y` flag. These are shared,
 * module-level instances, and a sticky/global RegExp keeps `lastIndex` between
 * calls — so two unrelated call sites would silently corrupt each other's
 * matches. A pattern needing `g` must be constructed per use, not added here.
 */
export const RegexConstants = {
  /** Every leading `#` on an ingredient line, so a heading strips to its label. */
  leadingIngredientGroupMarkers: /^#+/,
  /** Pragmatic e-mail shape check: non-space local@domain.tld. */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** `#RGB`, `#RRGGBB` or `#RRGGBBAA`. */
  hexColor: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
  /** Strictly `#RRGGBB`. */
  hexColor6: /^#[0-9a-fA-F]{6}$/,
  /** 64 hex chars — a SHA-256 digest or a 256-bit key. */
  sha256Hex: /^[0-9a-fA-F]{64}$/,
  /** Digits only, at least one. */
  digitsOnly: /^\d+$/,
  /**
   * Anything that can turn an in-app path into another origin once a browser
   * normalises it: a backslash, a control character, or an encoded slash /
   * backslash. Used to vet a post-login redirect.
   */
  unsafeRedirect: /[\\\u0000-\u001f\u007f]|%(2f|5c)/i,
  /** Contains at least one ASCII capital letter. */
  hasUppercase: /[A-Z]/,
  /** Contains at least one digit. */
  hasDigit: /[0-9]/,
  /** Contains at least one character that is not an ASCII letter or digit. */
  hasSymbol: /[^A-Za-z0-9]/,
  /** Absolute http(s) URL prefix. */
  absoluteHttpUrl: /^https?:\/\//i,
} as const;
