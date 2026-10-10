/**
 * What an auth field holds, told to the platform's password manager: iOS Keychain
 * and Google's autofill suggest, save and generate credentials only for a field
 * that names its content.
 */
export const AuthAutofill = {
  Email: 'email',
  Password: 'password',
  /** A password being chosen: iOS offers a strong one and saves it. */
  NewPassword: 'new-password',
  Name: 'name',
} as const;

export type AuthAutofillType = (typeof AuthAutofill)[keyof typeof AuthAutofill];
