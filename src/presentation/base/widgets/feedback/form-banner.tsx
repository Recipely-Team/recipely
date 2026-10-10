import { Pressable, StyleSheet, View } from 'react-native';
import { SEVERITY_ICON } from '@presentation/base/theme/colors/surfaces/severity-icon';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAnnounce } from '@presentation/base/hooks/accessibility/use-announce';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import type { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { spacing, radii, fontWeights, iconSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface FormBannerProps {
  message: string;
  severity?: SeverityType;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Draws a close button at the trailing edge; without it the banner cannot be dismissed. */
  onDismiss?: () => void;
}

/**
 * A message banner pinned above a form — the design's mechanism for a rejected
 * submission that belongs to the whole form, not one field (e.g. "Couldn't sign
 * in. Email or password is wrong."). Severity-tinted; danger by default.
 * VoiceOver hears it through `useAnnounce` — the live region is Android-only.
 */
export const FormBanner = ({
  message,
  severity = 'danger',
  icon,
  onDismiss,
}: FormBannerProps): React.JSX.Element => {
  const surface = useSeveritySurfaces()[severity];
  useAnnounce(message);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: surface.bg, borderColor: surface.border }]}
    >
      <Ionicons name={icon ?? SEVERITY_ICON[severity]} size={iconSizes.lg} color={surface.icon} />
      <ThemedText variant="caption" style={[styles.message, { color: surface.text }]}>
        {message}
      </ThemedText>
      {onDismiss !== undefined ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={spacing.sm}
          style={styles.dismiss}
          accessibilityRole="button"
          accessibilityLabel={t().errors.dismiss}
        >
          <Ionicons name="close" size={iconSizes.md} color={surface.text} />
        </Pressable>
      ) : null}
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
  dismiss: {
    opacity: opacities.pressedStrong,
  },
});
