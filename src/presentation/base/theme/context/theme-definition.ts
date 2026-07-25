import type { ThemeColors } from '@presentation/base/theme/colors/palette/theme-colors';
import type { ThemeVariant } from '@presentation/base/theme/context/theme-variant';

export interface ThemeDefinition {
  name: string;
  nameTr: string;
  description: string;
  preferredVariant: ThemeVariant;
  light: ThemeColors;
  dark: ThemeColors;
}
