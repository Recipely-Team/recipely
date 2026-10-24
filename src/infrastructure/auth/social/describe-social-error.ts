import { hasKey, isString } from '@core/guards/type-guards';

/**
 * What a provider error says, with its code first: `10: DEVELOPER_ERROR` from
 * Google Sign-In, `auth/invalid-credential: …` from Firebase.
 *
 * @remarks
 * - **The code is the diagnosis.** A dev Android build failed Google sign-in
 *   while production worked on the same phone, and only "Something went wrong"
 *   reached anyone: the message without the code cannot tell a signing
 *   certificate Google does not know from a Play services outage.
 */
export const describeSocialError = (error: unknown, fallback: string): string => {
  const message = error instanceof Error ? error.message : fallback;
  const code = hasKey(error, 'code') ? error.code : undefined;
  return isString(code) || typeof code === 'number' ? `${String(code)}: ${message}` : message;
};
