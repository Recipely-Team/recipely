import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { isWeb } from '@infrastructure/constants/platform';
import { t } from '@presentation/i18n';

export interface PhotoDropZoneProps {
  onPress: () => void;
}

/**
 * The editor's photos before there are any: one target, the whole zone.
 *
 * The outlined "Add photos" inside it is drawn, not a second button — a
 * button inside a button is invalid on the web, and both would do the same.
 */
export const PhotoDropZone = ({ onPress }: PhotoDropZoneProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t().mediaPicker.add}
      style={[styles.zone, { backgroundColor: colors.surface, borderColor: colors.inputBorder }]}
    >
      <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="camera" size={iconSizes.xxl} color={colors.primary} />
      </View>
      <ThemedText variant="body" style={styles.title}>
        {t().mediaPicker.photos}
      </ThemedText>
      <ThemedText variant="caption" muted style={styles.hint}>
        {isWeb() ? t().mediaPicker.hint : t().mediaPicker.hintWithCamera}
      </ThemedText>
      <View style={[styles.outline, { borderColor: colors.primary }]}>
        <Ionicons name="image" size={iconSizes.sm} color={colors.primary} />
        <ThemedText style={[styles.outlineText, { color: colors.primary }]}>{t().mediaPicker.add}</ThemedText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  zone: {
    borderRadius: radii.lg,
    borderWidth: borderWidths.medium,
    borderStyle: 'dashed',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Pinned: a circle, not a text box.
  badge: {
    width: controlSizes.buttonSm,
    height: controlSizes.buttonSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: fontWeights.semibold,
  },
  hint: {
    textAlign: 'center',
  },
  outline: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs2,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  outlineText: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semibold,
  },
});
