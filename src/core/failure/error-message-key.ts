/**
 * The stable keys of the backend error catalogue that this client knows BY NAME
 * — i.e. the ones it either raises itself or gives dedicated user copy to. It is
 * deliberately NOT a mirror of the server catalogue: a key absent from here is
 * not an error, it simply falls back to the coarse `code`-based copy (see
 * `@presentation/base/errors/message-key-to-content-key`).
 *
 * Lives in `core` because `messageKey` is part of the `Failure` contract, and
 * both layers above need the same literals: `application` raises client-side
 * failures on this channel (a blank prompt, an unsupported link — the guards
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
  // The backend's over-long prompt/refine key.
  promptTooLong: 'errors.validation.prompt_too_long',
  // Client-raised only: refine asks what to change, not what to cook.
  refineInstructionRequired: 'errors.ai.refine_instruction_required',

  // Link import: Instagram videos and recipe web pages
  importInvalidUrl: 'errors.import.invalid_url',
  /** A link from a source the import cannot read — any site, not only a non-Instagram one. */
  importUnsupportedSource: 'errors.import.unsupported_source',
  /**
   * The same rejection under the name it had while Instagram was the only
   * source. Every deployed backend still sends this one, so it stays readable.
   */
  importUnsupportedSourceLegacy: 'errors.import.not_instagram',
  importFetchFailed: 'errors.import.fetch_failed',
  importDurationExceeded: 'errors.import.duration_exceeded',
  importNoRecipeFound: 'errors.import.no_recipe_found',
  /** A web page opened, but it publishes no recipe markup to read. */
  importNoRecipeOnPage: 'errors.import.no_recipe_on_page',
  /** A web page could not be fetched at all: dead link, blocked, or down. */
  importPageUnreachable: 'errors.import.page_unreachable',
  importBusy: 'errors.import.busy',
  // File import: photos of a recipe's pages, or a PDF
  /** The request carried no file at all. */
  importNoFile: 'errors.import.no_file',
  /** A file that is neither a photo (JPEG, PNG, WebP, HEIC) nor a PDF. */
  importUnsupportedFile: 'errors.import.unsupported_file',
  /** More than five photos, more than one PDF, or photos and a PDF together. */
  importTooManyFiles: 'errors.import.too_many_files',
  /** The pages were read, and no recipe was on them. */
  importNoRecipeInFile: 'errors.import.no_recipe_in_file',
  /** The file could not be opened: corrupt, encrypted, or not what it claims to be. */
  importUnreadableFile: 'errors.import.unreadable_file',
  recipeExists: 'errors.conflict.recipe_exists',
  /** The title names nothing you could eat — keyboard mash, a placeholder. */
  nameMeaningless: 'errors.recipe.name_meaningless',
  /** The generation prompt asked for nothing at all. */
  promptMeaningless: 'errors.ai.prompt_meaningless',
  /** The moderator looked at the photo and refused it. */
  photoRejected: 'errors.recipe.photo_rejected',
  /** The moderator could not answer, so the upload was refused rather than published unchecked. */
  photoUnchecked: 'errors.recipe.photo_unchecked',
  /** The moderator rejected the recipe; it cannot be offered again. */
  publishRejected: 'errors.recipe.publish_rejected',
  /** A website import still carries the site's photo or wording (409, `details.blockers`). */
  publishBlockedCopyright: 'errors.recipe.publish_blocked_copyright',
  /** A published recipe cannot be edited; it is taken back to private first. */
  editPublished: 'errors.recipe.edit_published',
  /** The photo is not on the recipe (any more). */
  photoNotFound: 'errors.not_found.photo',
  /** An edit that changes nothing. */
  nothingToEdit: 'errors.validation.nothing_to_edit',

  // Food diary
  /** The entry is gone — deleted on another device, or never this user's. */
  diaryEntryNotFound: 'errors.not_found.diary_entry',
  diaryFoodNameRequired: 'errors.validation.food_name_required',
  diaryFoodNameTooLong: 'errors.validation.food_name_too_long',
  /** Calories or grams past the plausibility cap (a mistyped extra zero). */
  diaryNutrientInvalid: 'errors.validation.nutrient_invalid',
  diaryGoalInvalid: 'errors.validation.goal_invalid',

  // Creator tag
  /** The handle breaks the contract's rules: charset, per-platform length, dots. */
  creatorHandleInvalid: 'errors.validation.creator_handle',
  /** Another approved creator already holds the same platform + handle. */
  creatorHandleTaken: 'errors.conflict.creator_handle_taken',
  /** An approve or reject of a claim that is no longer pending (the admin path). */
  creatorNotPending: 'errors.conflict.creator_not_pending',
  // Instagram connect + automations (backend #374)
  instagramNotConfigured: 'errors.instagram.not_configured',
  instagramLinkInvalid: 'errors.instagram.link_invalid',
  instagramAccountLinked: 'errors.conflict.instagram_account_linked',
  instagramNotConnected: 'errors.instagram.not_connected',
  instagramReturnInvalid: 'errors.validation.instagram_return_invalid',

  // Shopping list
  shoppingLabelRequired: 'errors.validation.shopping_label_required',
  shoppingLabelTooLong: 'errors.validation.shopping_label_too_long',
  shoppingQuantityInvalid: 'errors.validation.shopping_quantity_invalid',
  shoppingUnitTooLong: 'errors.validation.shopping_unit_too_long',
  shoppingItemInvalid: 'errors.validation.shopping_item_invalid',
  shoppingBatchInvalid: 'errors.validation.shopping_batch_invalid',
  shoppingItemNotFound: 'errors.not_found.shopping_item',
  shoppingListFull: 'errors.conflict.shopping_list_full',
  shoppingListChanged: 'errors.conflict.shopping_list_changed',
  shoppingRateLimited: 'errors.too_many_requests.shopping_list',
  contentBlocked: 'errors.validation.content_blocked',

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
