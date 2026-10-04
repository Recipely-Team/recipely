/**
 * The bounds a comment-to-DM rule is held to — mirrors recipely-backend
 * `dm-rule` validation (#374), so the editor refuses exactly what the server
 * would.
 */
export const DmRuleLimits = {
  KeywordsMin: 1,
  KeywordsMax: 10,
  KeywordMaxLength: 40,
  DmTextMax: 900,
  PublicReplyMax: 300,
  /** `GET /me/instagram/media` serves no page past this. */
  MediaPagesMax: 20,
} as const;
