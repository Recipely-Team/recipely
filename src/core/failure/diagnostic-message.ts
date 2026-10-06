/**
 * Every sentence the app puts in a `Failure.message`, in one place.
 *
 * @remarks
 * - **These are diagnostics, not user copy.** Nothing renders
 *   `Failure.message`: presentation resolves what a user reads from
 *   `messageKey`, then `code` (`failure-lookups.ts`). These strings reach a log
 *   line, a crash report, or a developer reading a `Result` — which is exactly
 *   why they were easy to leave scattered and inconsistent.
 * - **Why core.** They populate a field of `Failure`, which lives here, so the
 *   catalogue sits with the type it fills and every layer that constructs a
 *   failure can reach it without crossing a boundary.
 * - **Functions where the text carries a value.** A byte count or a caught
 *   error's own message has to be interpolated; making those functions keeps
 *   the wording here rather than half here and half at the call site.
 */
export const DiagnosticMessage = {
  crypto: {
    badKeyLength: 'AES key must be 64 hex chars (32 bytes)',
    missingEnvelopeFields: 'Envelope missing payload or iv',
    payloadShorterThanTag: 'Payload shorter than auth tag',
    badIvLength: (bytes: number): string => `IV must decode to ${bytes} bytes`,
    decryptFailed: (reason: string): string => `Failed to decrypt: ${reason}`,
    unknownReason: 'unknown',
  },
  socialAuth: {
    firebaseNotConfiguredOnWeb: 'Firebase is not configured for web',
    googleCancelled: 'Google sign-in was cancelled',
    googleNoIdToken: 'Google did not return an ID token',
    googleFailed: 'Google sign-in failed',
    appleCancelled: 'Apple sign-in was cancelled',
    appleUnavailable: 'Apple Sign-In is not available on this device',
    appleNoIdentityToken: 'Apple did not return an identity token',
    appleFailed: 'Apple sign-in failed',
  },
  jwt: {
    malformed: 'Malformed JWT',
    payloadNotAnObject: 'JWT payload is not an object',
    payloadUndecodable: 'Could not decode JWT payload',
  },
  storage: {
    persistFailed: 'Failed to persist session',
    readFailed: 'Failed to read session',
    clearFailed: 'Failed to clear session',
    malformedJson: 'Stored session is malformed JSON',
  },
  network: {
    timedOut: 'Request timed out',
    unreachable: 'Network unreachable',
    unexpected: 'Unexpected error',
    badEnvelope: (reason: string): string => `Bad envelope: ${reason}`,
    uploadFailed: (status: number): string => `Network error (status ${status})`,
  },
  recipeImport: {
    urlRequired: 'Import link is required',
    /** A site known to hold recipes this import cannot read (YouTube, Facebook, X, Pinterest). */
    unsupportedSite: (url: string): string => `Not a site imports can read (${url})`,
    /** Not a link at all, or a video platform's page that is not one video (a profile). */
    notImportable: (url: string): string => `Not an importable link (${url})`,
    /** The queued job came back `failed`; the reason rides on its `errorKey`. */
    jobFailed: 'Instagram import job failed',
    /** `done` with no draft to open — the backend writes one before reporting done. */
    doneWithoutDraft: 'Instagram import reported done with no draft id',
  },
  fileImport: {
    noFile: 'File import has no file',
    unsupportedFile: 'File import got a type it cannot read',
    fileTooLarge: 'File import got a file over the size limit',
    tooManyFiles: 'File import got more files than one import takes',
  },
  recipeCreate: {
    /** Publishing threw instead of returning a Result; the UI must not hang. */
    threw: 'Recipe creation threw',
  },
  ai: {
    promptRequired: 'Prompt is required',
    refineInstructionRequired: 'Refine instruction is required',
  },
  feedback: {
    messageRequired: 'Message is required',
  },
  ads: {
    /**
     * The SSP's own reason a banner did not fill, carried through verbatim.
     *
     * The reason is the whole point: code 3 ("no fill") is a healthy account
     * with no inventory yet, while code 1 ("invalid request") is a wrong unit
     * id or an app id the manifest never got — two problems that look identical
     * from the outside, because both render nothing at all.
     */
    bannerFailed: (reason: string): string => `Banner ad failed to load: ${reason}`,
  },
  auth: {
    invalidEmail: 'Invalid email format',
    passwordTooShort: 'Password is shorter than the minimum length',
    noActiveSession: 'No active session to update',
    sessionUserChanged: 'The signed-in user changed before the answer arrived',
    appleUnavailableInBuild: 'Apple Sign-In is not available in this build',
    googleUnavailableInBuild: 'Google Sign-In is not available in this build',
  },
  /**
   * Entity invariants. Each names the field it guards, because a caller reading
   * a `Result` has only this sentence to tell which rule it broke.
   */
  entity: {
    session: {
      idRequired: 'Session id must be non-empty',
      accessTokenRequired: 'accessToken must be non-empty',
      expiresAtInvalid: 'expiresAt must be a valid Date',
    },
    user: {
      idRequired: 'User id must be non-empty',
      displayNameRequired: 'User displayName must be non-empty',
    },
    userProfile: {
      idRequired: 'UserProfile id must be non-empty',
      displayNameRequired: 'UserProfile displayName must be non-empty',
    },
    creatorSummary: {
      idRequired: 'CreatorSummary id must be non-empty',
      displayNameRequired: 'CreatorSummary displayName must be non-empty',
    },
    comment: {
      idRequired: 'Comment id must be non-empty',
      recipeIdRequired: 'Comment recipeId must be non-empty',
      authorIdRequired: 'Comment authorId must be non-empty',
      bodyRequired: 'Comment body must be non-empty',
    },
    notification: {
      idRequired: 'Notification id must be non-empty',
    },
    diaryEntry: {
      idRequired: 'Diary entry id must be non-empty',
      nameRequired: 'Diary entry name must be non-empty',
      servingsInvalid: 'Servings must be a positive number no larger than the diary limit',
    },
    recipe: {
      idRequired: 'Recipe id must be non-empty',
      nameRequired: 'Recipe name must be non-empty',
      servingsTooLow: 'Servings must be at least 1',
      caloriesNegative: 'Calories must be non-negative',
      focalPointOutOfFrame: 'Focal point must lie within 0..1 on both axes',
      imageCreditIncomplete: 'Image credit needs an author, a licence and an http(s) link',
    },
  },
  creator: {
    handleInvalid: (platform: string): string => `Not a valid ${platform} handle`,
    platformInvalid: (raw: string): string => `Not a creator platform: ${raw}`,
    claimStatusInvalid: (raw: string): string => `Not a creator claim status: ${raw}`,
    duplicatePlatform: (platform: string): string => `More than one creator claim for ${platform}`,
    tagsRequired: 'A listed creator needs at least one approved tag',
    duplicateTag: 'A creator has at most one tag per platform',
  },
  diary: {
    dateInvalid: (raw: string): string => `Not a calendar date (YYYY-MM-DD): ${raw}`,
    monthInvalid: (raw: string): string => `Not a calendar month (YYYY-MM): ${raw}`,
    mealInvalid: (raw: string): string => `Not a meal slot: ${raw}`,
    nutrientInvalid: (field: string): string => `Nutrient ${field} must be a finite, non-negative number`,
    goalInvalid: (field: string): string => `Nutrition goal ${field} is outside its allowed range`,
    waterInvalid: (glasses: number): string => `Water must be whole glasses within the daily range, got ${glasses}`,
    servingsOffStep: 'Servings must be a multiple of the serving step within its range',
    foodNameRequired: 'Food name must be non-empty',
    foodNameTooLong: 'Food name is longer than the diary allows',
    nutrientTooHigh: (field: string): string => `Nutrient ${field} is past the diary's plausibility cap`,
    recipeWithoutCalories: 'A recipe without calories per serving cannot be logged',
    foodWithoutVariants: 'A catalogue food arrived without any variant',
    foodUnitInvalid: (raw: string): string => `Not a food base unit (g or ml): ${raw}`,
    foodSourceInvalid: (raw: string): string => `Not a food source: ${raw}`,
    foodKindInvalid: (raw: string): string => `Not a food kind: ${raw}`,
  },
  instagram: {
    keywordInvalid: 'A keyword must be 1–40 characters',
    tooManyKeywords: 'A rule holds at most 10 keywords',
    keywordsRequired: 'A rule needs at least one keyword',
    mediaRequired: 'A rule needs a post or Reel',
    recipeRequired: 'A rule needs a recipe to send',
    dmTextInvalid: 'The DM must carry {link} and stay within 900 characters',
    publicReplyInvalid: 'A public reply must be 1–300 characters when it is on',
    sourceInvalid: (field: string, raw: string): string => `Not a valid Instagram ${field}: ${raw}`,
    returnLinkUnreadable: 'The Instagram login returned without a usable result',
  },
  assistant: {
    microphoneDenied: 'Microphone permission was refused',
    microphoneUnavailable: (reason: string): string => `Microphone could not start: ${reason}`,
    playerUnavailable: (reason: string): string => `Audio output could not start: ${reason}`,
    sessionSocketFailed: 'Live session socket failed',
    connectTimedOut: 'Live session did not complete setup in time',
    sessionClosedBeforeReady: 'Live session closed before setup completed',
    actionFailed: (reason: string): string => `Assistant action failed: ${reason}`,
    noAnswer: 'The model did not answer the turn',
    connectionRefused: (reason: string): string => `No live session credential: ${reason}`,
    connectionLost: 'Live session dropped and could not be continued',
    intentTokenUndated: 'The intent token arrived without a usable expiry',
    likeStateNotLoaded: 'Like state for this recipe has not arrived yet',
    likeAlreadyInFlight: 'A like for this recipe is already in flight',
  },
} as const;

/**
 * Field names a `ValidationFailure` points at. The UI matches on these to put
 * the error under the right input, so a typo silently detaches the message from
 * its field.
 */
export const FailureField = {
  token: 'token',
  email: 'email',
  password: 'password',
  focus: 'focus',
  imageCredit: 'imageCredit',
  creatorHandle: 'handle',
  creatorPlatform: 'platform',
} as const;
