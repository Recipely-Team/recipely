import type { ThemeColors } from '@presentation/base/theme';
import type { ImportLook } from '@presentation/app/import-recipe/model/import-look';

const TWO_STOP_RING = [0, 1] as const;

/**
 * The import screen in the app's own palette: for a web page, which has no
 * platform to credit, and for a file the user photographed themselves.
 */
export const appImportLook = (colors: ThemeColors): ImportLook => ({
  gradient: [colors.primaryGradientStart, colors.primaryGradientEnd],
  ringStops: TWO_STOP_RING,
  accent: colors.primary,
  pill: [colors.primary, colors.primary],
  pillText: colors.primaryText,
});
