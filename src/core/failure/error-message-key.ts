/**
 * The stable keys of the backend error catalogue that this client knows BY NAME
 * — i.e. the ones it either raises itself or gives dedicated user copy to. It is
 * deliberately NOT a mirror of the server catalogue: a key absent from here is
 * not an error, it simply falls back to the coarse `code`-based copy (see
 * `@presentation/base/errors/message-key-to-content-key`).
 *
 * Lives in `core` because `messageKey` is part of the `Failure` contract, and
 * both layers above need the same literals: `application` raises client-side
 * failures on this channel (a blank prompt, a non-Instagram URL — the guards
 * that short-circuit before the network), and `presentation` maps the keys to
 * copy. One catalogue, so a key can never drift between the raiser and the
 * reader.
 */
export const ErrorMessageKey = {
  // AI generation
  aiPromptRejected: 'errors.ai.prompt_rejected',
  aiInvalidResponse: 'errors.ai.invalid_response',
  aiUpstreamFailed: 'errors.ai.upstream_failed',
  aiCooldown: 'errors.too_many_requests.ai_cooldown',
  promptRequired: 'errors.validation.prompt_required',
  // The backend rejects an over-long prompt or refine instruction with this key.
  // It was missing here, so `failureKeyMessage` returned undefined and the
  // generate screen fell through to its unnamed-4xx branch: "Yapay zekâ yanıt
  // veremedi — tekrar dene". The server had said exactly what was wrong, and the
  // app answered by telling the user to retry input that could never succeed.
  promptTooLong: 'errors.validation.prompt_too_long',
  // Client-raised only: refine has no server-side blank-instruction rule, and
  // "describe the dish" is the wrong advice when a recipe already exists on
  // screen — the user is asked what to CHANGE, not what to cook.
  refineInstructionRequired: 'errors.ai.refine_instruction_required',

  // Instagram import
  importInvalidUrl: 'errors.import.invalid_url',
  importNotInstagram: 'errors.import.not_instagram',
  importFetchFailed: 'errors.import.fetch_failed',
  importDurationExceeded: 'errors.import.duration_exceeded',
  importNoRecipeFound: 'errors.import.no_recipe_found',
  importBusy: 'errors.import.busy',
  recipeExists: 'errors.conflict.recipe_exists',
  /** The title names nothing you could eat — keyboard mash, a placeholder. */
  nameMeaningless: 'errors.recipe.name_meaningless',
  /** The generation prompt asked for nothing at all. */
  promptMeaningless: 'errors.ai.prompt_meaningless',
  /** The moderator looked at the photo and refused it. */
  photoRejected: 'errors.recipe.photo_rejected',
  /** The moderator could not answer, so the upload was refused rather than published unchecked. */
  photoUnchecked: 'errors.recipe.photo_unchecked',

  // Registration / verification
  emailExists: 'errors.conflict.email_exists',
  codeInvalid: 'errors.validation.code_invalid',
  codeExpired: 'errors.validation.code_expired',
  codeAttemptsExceeded: 'errors.validation.code_attempts_exceeded',
  codeCooldown: 'errors.too_many_requests.code_cooldown',
  registrationExpired: 'errors.not_found.pending_registration',

  // Media upload
  invalidMediaType: 'errors.validation.invalid_media_type',
  invalidImageType: 'errors.validation.invalid_image_type',
  fileTooLarge: 'errors.validation.file_too_large',

  // Session / password reset
  accountDeleted: 'errors.unauthorized.account_deleted',
  resetLinkInvalid: 'errors.not_found.reset_token',
  resetLinkExpired: 'errors.validation.token_expired',
  resetLinkUsed: 'errors.validation.token_already_used',
  passwordTooShort: 'errors.validation.password_too_short',
} as const;
