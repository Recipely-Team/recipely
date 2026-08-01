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
  },
} as const;

/**
 * Field names a `ValidationFailure` points at. The UI matches on these to put
 * the error under the right input, so a typo silently detaches the message from
 * its field.
 */
export const FailureField = {
  token: 'token',
} as const;
