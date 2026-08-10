/**
 * The registered JWT claims this app reads. Three-letter names carry no meaning
 * on their own, so `exp` reads as a typo rather than "expires at" wherever it
 * appears without one.
 */
export const JwtClaim = {
  expiresAt: 'exp',
} as const;
