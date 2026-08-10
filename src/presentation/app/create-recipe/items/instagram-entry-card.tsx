import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontWeights,
  iconSizes,
  controlSizes,
  borderWidths,
  BrandColors,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface InstagramEntryCardProps {
  onPress: () => void;
}

const GRADIENT_START = { x: ValueConstants.zero, y: ValueConstants.zero };
const GRADIENT_END = { x: ValueConstants.one, y: ValueConstants.one };
const GRADIENT_STOPS = [
  BrandColors.instagramGradientStart,
  BrandColors.instagramGradientMid,
  BrandColors.instagramGradientEnd,
] as const;

/**
 * The way into the Instagram import that does not depend on the OS share sheet.
 *
 * Sharing from Instagram works on Android only, and never on the web — so this
 * card is how everyone else reaches the feature at all.
 */
export const InstagramEntryCard = ({ onPress }: InstagramEntryCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().importRecipe;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      accessibilityRole="button"
      accessibilityLabel={copy.pasteEntry}
    >
      <LinearGradient
        colors={[...GRADIENT_STOPS]}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={styles.badge}
      >
        <Ionicons name="logo-instagram" size={iconSizes.xl} color={BrandColors.white} />
      </LinearGradient>
      <View style={styles.body}>
        <ThemedText variant="body" style={styles.title}>
          {copy.pasteEntry}
        </ThemedText>
        <ThemedText variant="caption" style={{ color: colors.textMuted }}>
          {copy.pasteEntryHint}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={iconSizes.lg} color={colors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm2,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  badge: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: ValueConstants.one,
    gap: spacing.xxs,
  },
  title: {
    fontWeight: fontWeights.bold,
  },
});
