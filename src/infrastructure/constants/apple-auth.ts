/**
 * Firebase's identifiers for Sign in with Apple. The provider id is a magic
 * string Firebase matches exactly, and the scopes decide what Apple returns —
 * without `name` the first sign-in has no display name to save, and it is only
 * ever offered once per Apple ID.
 */
export const AppleAuth = {
  providerId: 'apple.com',
  scopes: ['email', 'name'] as const,
} as const;
