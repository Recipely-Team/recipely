import { StyleSheet, View } from 'react-native';
import { SEVERITY_ICON } from '@presentation/base/theme/colors/surfaces/severity-icon';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import type { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { spacing, radii, fontWeights, iconSizes, borderWidths } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface FormBannerProps {
  message: string;
  severity?: SeverityType;
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * A message banner pinned above a form — the design's mechanism for a rejected
 * submission that belongs to the whole form, not one field (e.g. "Couldn't sign
 * in. Email or password is wrong."). Severity-tinted; danger by default.
 */
export const FormBanner = ({
  message,
  severity = 'danger',
  icon,
}: FormBannerProps): React.JSX.Element => {
  const surface = useSeveritySurfaces()[severity];

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: surface.bg, borderColor: surface.border }]}
    >
      <Ionicons name={icon ?? SEVERITY_ICON[severity]} size={iconSizes.lg} color={surface.icon} />
      <ThemedText variant="caption" style={[styles.message, { color: surface.text }]}>
        {message}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  message: {
    flex: ValueConstants.one,
    fontWeight: fontWeights.semibold,
  },
});
