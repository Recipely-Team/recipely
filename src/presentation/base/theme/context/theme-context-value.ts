import type { ThemeIdType } from '@presentation/base/theme/context/theme-id';
import type { ThemeColors } from '@presentation/base/theme/colors/palette/theme-colors';
import type { ThemePreference } from '@presentation/base/theme/context/theme-preference';
import type { ThemeVariant } from '@presentation/base/theme/context/theme-variant';

export interface ThemeContextValue {
  themeId: ThemeIdType;
  preference: ThemePreference;
  scheme: ThemeVariant;
  colors: ThemeColors;
  setThemeId: (id: ThemeIdType) => void;
  setPreference: (pref: ThemePreference) => void;
}
