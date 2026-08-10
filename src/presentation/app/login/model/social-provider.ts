/** The identity providers the sign-in buttons offer. */
export const SocialProvider = {
  Google: 'google',
  Apple: 'apple',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type SocialProvider = (typeof SocialProvider)[keyof typeof SocialProvider];
