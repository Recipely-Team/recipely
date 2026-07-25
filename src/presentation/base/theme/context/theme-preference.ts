import type { ThemeVariant } from '@presentation/base/theme/context/theme-variant';

/**
 * What the user ASKED for — a superset of what can actually be rendered:
 * either a concrete {@link ThemeVariant} or "follow the device".
 *
 * Derived from `ThemeVariant` instead of re-listing `'light' | 'dark'`, so the
 * two can never drift: adding a variant extends the preference automatically.
 *
 * They stay DISTINCT types on purpose. `ThemeVariant` names a key of
 * `ThemeDefinition`, which has exactly `light` and `dark` and no `system`. If
 * the two were one type, `getThemeColors(id, 'system')` would compile and
 * silently fall through to the light branch — a wrong colour instead of a build
 * error. The narrowing in `theme-context.tsx`
 * (`preference === 'system' ? systemScheme : preference`) is the boundary that
 * turns a request into something renderable, and only a narrower target type
 * forces that boundary to exist.
 */
export type ThemePreference = ThemeVariant | 'system';
