import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, controlSizes, diarySizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';

export interface MealLogEntryButtonProps {
  onPress: () => void;
}

/** The pick step's way into "Describe or photograph your meal": one card-like row above the tabs. */
export const MealLogEntryButton = ({ onPress }: MealLogEntryButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().diary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={strings.mealLogEntry}
      accessibilityHint={strings.mealLogEntryHint}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, opacity: pressed ? opacities.pressedSubtle : opacities.full },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="sparkles-outline" size={iconSizes.lg} color={colors.chipText} />
      </View>
      <View style={styles.text}>
        <SizedText size={fontSizes.body} weight={fontWeights.bold}>
          {strings.mealLogEntry}
        </SizedText>
        <SizedText size={fontSizes.caption} muted>
          {strings.mealLogEntryHint}
        </SizedText>
      </View>
      <Ionicons name="chevron-forward" size={iconSizes.lg} color={colors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: diarySizes.pickRowMinHeight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  icon: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: ValueConstants.one, gap: spacing.xxs },
});
