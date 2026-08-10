/**
 * The inputs an auth form can focus. Typed so the focus ring cannot be driven
 * by a name no field answers to — these were compared against a
 * `useState<string | null>`, where a typo simply never highlighted anything.
 */
export const AuthField = {
  Email: 'email',
  Password: 'password',
  NewPassword: 'new',
  ConfirmPassword: 'confirm',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type AuthField = (typeof AuthField)[keyof typeof AuthField];
