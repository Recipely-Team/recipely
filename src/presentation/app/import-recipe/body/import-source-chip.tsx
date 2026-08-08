import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  letterSpacings,
  iconSizes,
  decorSizes,
  borderWidths,
  BrandColors,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/** Instagram's own gradient runs corner to corner, warm to violet. */
const GRADIENT_START = { x: ValueConstants.zero, y: ValueConstants.zero };
const GRADIENT_END = { x: ValueConstants.one, y: ValueConstants.one };
const GRADIENT_STOPS = [
  BrandColors.instagramGradientStart,
  BrandColors.instagramGradientMid,
  BrandColors.instagramGradientEnd,
] as const;

/** "From Instagram" — says where the thing being imported came from. */
export const ImportSourceChip = (): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <LinearGradient
        colors={[...GRADIENT_STOPS]}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={styles.badge}
      >
        <Ionicons name="logo-instagram" size={iconSizes.sm} color={BrandColors.white} />
      </LinearGradient>
      <ThemedText variant="caption" style={[styles.label, { color: colors.textMuted }]}>
        {t().importRecipe.kicker}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  badge: {
    width: decorSizes.badgeSm,
    height: decorSizes.badgeSm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
  },
});
