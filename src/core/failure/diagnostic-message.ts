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
    urlRequired: 'Instagram URL is required',
    notAnInstagramUrl: (url: string): string => `Not an Instagram URL (${url})`,
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
  auth: {
    invalidEmail: 'Invalid email format',
    noActiveSession: 'No active session to update',
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
    comment: {
      idRequired: 'Comment id must be non-empty',
      recipeIdRequired: 'Comment recipeId must be non-empty',
      authorIdRequired: 'Comment authorId must be non-empty',
      bodyRequired: 'Comment body must be non-empty',
    },
    notification: {
      idRequired: 'Notification id must be non-empty',
    },
    recipe: {
      idRequired: 'Recipe id must be non-empty',
      nameRequired: 'Recipe name must be non-empty',
      servingsTooLow: 'Servings must be at least 1',
      caloriesNegative: 'Calories must be non-negative',
    },
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
} as const;
