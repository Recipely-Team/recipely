import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { FridgeAvailability } from '@application/fridge/fridge-availability';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useFridgeAvailability } from '@presentation/base/hooks/recipes/use-fridge-availability';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { RoutePaths } from '@presentation/base/constants';
import { borderWidths, fontSizes, fontWeights, fridgeSizes, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/**
 * The AI create screen's two ways in (design spec → Cook from my fridge,
 * Route & entry points): *Describe it* — this screen, selected — and *From my
 * fridge*, which opens the photo flow. Nothing while `fridgeToRecipe` is off,
 * so the screen is exactly as before.
 */
export const PromptModeCards = (): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const router = useRouter();
  const availability = useFridgeAvailability();
  if (availability !== FridgeAvailability.On) return null;
  const strings = t().fridge;

  const card = (selected: boolean, icon: keyof typeof Ionicons.glyphMap, title: string, sub: string, onPress?: () => void): React.JSX.Element => (
    <Pressable
      onPress={onPress}
      disabled={onPress === undefined}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
        selected
          ? { backgroundColor: colors.chipBackground, borderColor: colors.primary, borderWidth: borderWidths.medium }
          : { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderWidth: borderWidths.hairline },
        { opacity: pressed ? opacities.pressedSubtle : opacities.full },
      ]}
    >
      <Ionicons name={icon} size={iconSizes.lg} color={colors.primary} />
      <SizedText size={fontSizes.medium} weight={fontWeights.heavy}>
        {title}
      </SizedText>
      <SizedText size={fontSizes.caption} color={colors.textMuted} numberOfLines={ValueConstants.two}>
        {sub}
      </SizedText>
    </Pressable>
  );

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {card(true, 'create-outline', strings.modeDescribeTitle, strings.modeDescribeSub)}
      {card(false, 'camera-outline', strings.modeFridgeTitle, strings.modeFridgeSub, () => router.push(RoutePaths.fridge))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  card: {
    flex: ValueConstants.one,
    minHeight: fridgeSizes.modeCardMinHeight,
    padding: spacing.md,
    borderRadius: radii.xl,
    gap: spacing.xxs,
  },
});
