import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, diarySizes, fontSizes, fontWeights, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface EmptyMealButtonProps {
  /** The meal's name, for the spoken label. */
  mealName: string;
  onPress: () => void;
}

/** A meal with nothing in it: a dashed box reading "Nothing logged yet" and "+ Add" (design spec → Food Diary §4). */
export const EmptyMealButton = ({ mealName, onPress }: EmptyMealButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().diary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={strings.addToMeal.replace('{meal}', mealName)}
      style={({ pressed }) => [styles.box, { borderColor: colors.border, opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
    >
      <SizedText size={fontSizes.medium} muted>
        {strings.nothingLogged}
      </SizedText>
      <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.primary}>
        {`+ ${strings.add}`}
      </SizedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: diarySizes.emptyMealMinHeight,
    borderWidth: borderWidths.thin,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
});
