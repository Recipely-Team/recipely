/**
 * Result of requesting (or resending) a registration email-verification code.
 * The account is NOT created yet — the user must confirm the 6-digit code sent
 * to `email` before it expires via `AuthRepositoryInterface.verifyRegistration`.
 *
 * `expiresAt` is the absolute ISO-8601 instant the code lapses; the client
 * drives its countdown off it so navigating back/forward never resets the
 * timer (the backend echoes the same `expiresAt` for an in-flight code).
 * `expiresInSeconds` is the remaining whole seconds at the time of the
 * response, kept for convenience.
 */
export interface RegistrationChallenge {
  readonly email: string;
  readonly expiresInSeconds: number;
  readonly expiresAt: string;
}
