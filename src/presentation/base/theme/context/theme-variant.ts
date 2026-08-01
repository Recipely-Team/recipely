/**
 * Which of a theme's two colour schemes is in play.
 *
 * Deliberately NOT React Native's `ColorSchemeName`, which is
 * `'light' | 'dark' | 'unspecified'`: that type describes what the OS *reports*,
 * and can be absent. This one describes what the app *resolved* — a
 * `ThemePreference` of `'system'` is turned into a concrete variant before it
 * reaches any component, so there is no third state to handle downstream.
 */
export const ThemeVariant = {
  Light: 'light',
  Dark: 'dark',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type ThemeVariant = (typeof ThemeVariant)[keyof typeof ThemeVariant];
