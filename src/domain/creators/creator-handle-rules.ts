import { CreatorPlatform } from '@domain/creators/creator-platform';

/**
 * The handle rules of docs/creator-tag-contract.md, named once.
 *
 * @remarks
 * - **Mirrors the backend, which is the authority.** A handle the app accepts
 *   and the server refuses comes back as `errors.validation.creator_handle`;
 *   these are never looser than the server's.
 * - **Per-platform lengths** are the platforms' own limits: Instagram 1–30,
 *   TikTok 2–24.
 */
export const CreatorHandleRules = {
  /** Stripped once from the front, as people paste `@name`. */
  Prefix: '@',
  /** Lower-case letters, digits, `.` and `_` — checked after lower-casing. */
  Charset: /^[a-z0-9._]+$/,
  Dot: '.',
  DoubleDot: '..',
  Length: {
    [CreatorPlatform.Instagram]: { Min: 1, Max: 30 },
    [CreatorPlatform.TikTok]: { Min: 2, Max: 24 },
  },
} as const;
