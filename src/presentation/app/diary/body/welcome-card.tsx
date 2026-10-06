import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import {
  borderWidths,
  controlSizes,
  diarySizes,
  fontSizes,
  fontWeights,
  iconSizes,
  lineHeights,
  opacities,
  radii,
  shadows,
  spacing,
} from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface WelcomeCardProps {
  goalCalories: number;
  onLogFirstMeal: () => void;
  onSetGoals: () => void;
}

/** The first-day card (design spec → Food Diary §8): what the diary is, the starting goal, and the two first moves. */
export const WelcomeCard = ({ goalCalories, onLogFirstMeal, onSetGoals }: WelcomeCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().diary;
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={[styles.tile, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="calendar" size={iconSizes.xl} color={colors.chipText} />
      </View>
      <SizedText accessibilityRole="header" size={fontSizes.subtitle} weight={fontWeights.heavy}>
        {strings.welcomeTitle}
      </SizedText>
      <SizedText size={fontSizes.medium} ratio={lineHeights.normal}>
        {strings.welcomeBody}
      </SizedText>
      <SizedText size={fontSizes.small} muted ratio={lineHeights.normal}>
        {strings.welcomeGoalNote.replace('{n}', formatWholeNumber(goalCalories, locale))}
      </SizedText>
      <View style={styles.actions}>
        <Pressable
          onPress={onLogFirstMeal}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
        >
          <SizedText size={fontSizes.medium} weight={fontWeights.bold} color={colors.primaryText}>
            {strings.logFirstMeal}
          </SizedText>
        </Pressable>
        <Pressable
          onPress={onSetGoals}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            styles.outlined,
            { borderColor: colors.cardBorder, opacity: pressed ? opacities.pressedSubtle : opacities.full },
          ]}
        >
          <SizedText size={fontSizes.medium} weight={fontWeights.bold}>
            {strings.setMyGoals}
          </SizedText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    ...shadows.sm,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  tile: {
    width: diarySizes.welcomeTile,
    height: diarySizes.welcomeTile,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  button: {
    flexGrow: ValueConstants.one,
    minHeight: controlSizes.buttonSm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: { borderWidth: borderWidths.hairline },
});
