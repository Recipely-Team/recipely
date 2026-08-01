import type { Ionicons } from '@expo/vector-icons';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';

/**
 * The icon that stands for each severity.
 *
 * Toasts and form banners both draw it, and each had its own copy — so the two
 * surfaces could disagree about what a warning looks like while claiming the
 * same severity.
 */
export const SEVERITY_ICON: Record<SeverityType, keyof typeof Ionicons.glyphMap> = {
  [SeverityType.Danger]: 'alert-circle',
  [SeverityType.Warning]: 'warning',
  [SeverityType.Success]: 'checkmark-circle',
  [SeverityType.Neutral]: 'information-circle',
};
