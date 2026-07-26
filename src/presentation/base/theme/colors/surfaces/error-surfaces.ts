import type { ThemeColors } from '@presentation/base/theme/colors/palette/theme-colors';
import type { ThemeVariant } from '@presentation/base/theme/context/theme-variant';
import type { SeveritySurfaces } from '@presentation/base/theme/colors/surfaces/severity-surfaces';

// WHY: these hexes are intentionally fixed per light/dark variant rather than
// derived from the 20 brand palettes — danger must read as "red" and warning as
// "amber" regardless of the active theme. Confined here per the no-magic-values
// rule (theme constants file). Sourced from the Error States design spec.
const LIGHT: Omit<SeveritySurfaces, 'neutral'> = {
  danger: { bg: '#FDECEA', border: '#F3C7C2', text: '#B3261E', icon: '#D93025', disc: '#FBD7D2' },
  warning: { bg: '#FEF7E0', border: '#F1DE9C', text: '#7A5300', icon: '#E8920C', disc: '#FBEBB6' },
  success: { bg: '#E7F4EA', border: '#BBE3C4', text: '#1E7A34', icon: '#1F9D4D', disc: '#CFEBD6' },
};

const DARK: Omit<SeveritySurfaces, 'neutral'> = {
  danger: { bg: '#2A1413', border: '#5A2A27', text: '#F4A8A1', icon: '#F28B82', disc: '#3E1B18' },
  warning: { bg: '#2A2410', border: '#574A1E', text: '#FBE08A', icon: '#FDD663', disc: '#3A3216' },
  success: { bg: '#10231A', border: '#2A4A37', text: '#A3D9AF', icon: '#81C995', disc: '#163021' },
};

// WHY: toasts use a fixed near-black pill in both variants (the design floats a
// high-contrast surface above any screen) — slightly lifted in dark mode so it
// separates from a black background. Text on the pill is always white.
const TOAST_BG_LIGHT = '#1C1A17';
const TOAST_BG_DARK = '#1E1F24';

/** Background of the floating toast pill for the active variant. */
export const toastBackground = (variant: ThemeVariant): string =>
  variant === 'dark' ? TOAST_BG_DARK : TOAST_BG_LIGHT;

/** Foreground text/icon color on the toast pill (always white). */
export const TOAST_FOREGROUND = '#FFFFFF';

/**
 * Resolves the four severity surfaces for the active theme. `neutral` is woven
 * from the live theme tokens so empty/not-found states match the surrounding
 * UI, while danger/warning/success use the fixed semantic palette above.
 */
export const errorSurfaces = (
  variant: ThemeVariant,
  colors: ThemeColors,
): SeveritySurfaces => {
  const base = variant === 'dark' ? DARK : LIGHT;
  return {
    ...base,
    neutral: {
      bg: colors.surface,
      border: colors.cardBorder,
      text: colors.textMuted,
      icon: colors.textMuted,
      disc: colors.primaryLight,
    },
  };
};
