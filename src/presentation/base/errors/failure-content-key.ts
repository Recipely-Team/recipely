// The entries in the `errors` i18n namespace (each is { title, body, short }).
//
// Two tiers, in the order the resolver tries them:
//   1. key-tier — copy for one specific backend `messageKey`. Reserved for
//      errors the user can act on DIFFERENTLY than its neighbours (rephrase the
//      prompt vs. retry the AI vs. use an Instagram link vs. request a new code).
//   2. code-tier — the coarse per-`code` buckets, the fallback for every key we
//      have no dedicated copy for (and for any failure with no key at all).
export type FailureContentKey =
  // ── code-tier ──────────────────────────────────────────────────────────────
  | 'network'
  | 'timeout'
  | 'server'
  | 'notFound'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'rateLimit'
  | 'validation'
  // Copy of last resort: a cancellation is meant to be swallowed by the screen
  // (see `CancelledFailure`), so these words exist only so a caller that forgets
  // cannot fall through to "something went wrong".
  | 'cancelled'
  | 'unknown'
  // ── key-tier: AI generation ────────────────────────────────────────────────
  | 'aiPromptRejected'
  | 'aiInvalidResponse'
  | 'aiUpstreamFailed'
  | 'aiCooldown'
  | 'promptRequired'
  | 'refineInstructionRequired'
  // ── key-tier: Instagram import ─────────────────────────────────────────────
  | 'importInvalidUrl'
  | 'importNotInstagram'
  | 'importFetchFailed'
  | 'importDurationExceeded'
  | 'importNoRecipeFound'
  | 'importBusy'
  | 'recipeExists'
  // ── key-tier: registration / verification ──────────────────────────────────
  | 'emailExists'
  | 'codeInvalid'
  | 'codeExpired'
  | 'codeAttemptsExceeded'
  | 'codeCooldown'
  | 'registrationExpired'
  // ── key-tier: media upload ─────────────────────────────────────────────────
  | 'invalidMediaType'
  | 'invalidImageType'
  | 'fileTooLarge'
  // ── key-tier: session / password reset ─────────────────────────────────────
  | 'accountDeleted'
  | 'resetLinkInvalid'
  | 'resetLinkExpired'
  | 'resetLinkUsed'
  | 'passwordTooShort';
