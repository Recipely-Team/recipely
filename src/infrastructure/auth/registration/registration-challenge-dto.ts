// Wire shape returned by the Recipely backend POST /auth/register and
// /auth/register/resend. Matches recipely-backend `auth.controller.ts`.
// `devCode` is only present when the backend runs with EXPOSE_DEV_CODE on.

export interface RegistrationChallengeDto {
  message: string;
  email?: string;
  expiresInSeconds?: number;
  // Absolute ISO expiry; the countdown derives from it.
  expiresAt?: string;
  devCode?: string;
}
