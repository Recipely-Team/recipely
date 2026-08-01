import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { ThemeVariant } from '@presentation/base/theme/context/theme-variant';
import type { ThemeColors } from '@presentation/base/theme';

/**
 * React Navigation's theme, repainted in the app's own palette.
 *
 * The navigator paints the scene container itself, and it takes that colour
 * from this theme — not from whatever a screen renders inside it. Handing it
 * the stock `DarkTheme` meant the container was `rgb(1, 1, 1)` while every
 * dark theme the app ships is a deep colour (`#2A075F` royal purple,
 * `#0A1A33` pearl-white's dark, …). During a push the outgoing and incoming
 * screens slide across that container, so the gap between them flashed black —
 * most visibly opening a recipe from a bottom-tab screen. The light themes had
 * the same seam in `rgb(242, 242, 242)`, pale enough to read as a flicker
 * rather than a fault.
 *
 * Only the colours the navigator actually paints with are overridden; `fonts`
 * and the rest of the base theme are kept. `card` follows `background` because
 * the app's headers are flat on the page rather than a raised bar.
 */
export const navigationTheme = (scheme: ThemeVariant, colors: ThemeColors): Theme => {
  const base = scheme === ThemeVariant.Dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
      notification: colors.danger,
    },
  };
};
