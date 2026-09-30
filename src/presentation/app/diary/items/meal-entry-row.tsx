import { Pressable, StyleSheet, View } from 'react-native';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import { FoodThumb } from '@presentation/base/widgets/diary/food-thumb';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { formatServings } from '@presentation/base/utils/diary/format-servings';
import { formatMacroLine } from '@presentation/base/utils/diary/format-macro-line';
import { diarySizes, fontSizes, fontWeights, opacities, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface MealEntryRowProps {
  entry: FoodLogEntryEntity;
  onPress: (entry: FoodLogEntryEntity) => void;
}

/**
 * One logged food in a meal card: thumb, name, "2 servings · Recipe", the
 * macro line when the entry has macros, and its kcal. Tapping opens the Add
 * food sheet in edit mode (design spec → Food Diary §4).
 */
export const MealEntryRow = ({ entry, onPress }: MealEntryRowProps): React.JSX.Element => {
  const locale = useLocale();
  const strings = t().diary;
  const kcal = formatWholeNumber(entry.nutrients.calories, locale);
  const portion = [formatServings(entry.servings, locale), entry.isQuickAdd ? strings.sourceQuickAdd : strings.sourceRecipe].join(
    CharConstants.middotSpaced,
  );
  const macros = formatMacroLine(entry.nutrients, locale);
  return (
    <Pressable
      onPress={() => onPress(entry)}
      accessibilityRole="button"
      accessibilityLabel={strings.entryA11y.replace('{name}', entry.name).replace('{portion}', portion).replace('{kcal}', kcal)}
      style={({ pressed }) => [styles.row, { opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
    >
      <FoodThumb imageUrl={entry.recipeImageUrl} isQuickAdd={entry.isQuickAdd} size={diarySizes.foodThumb} />
      <View style={styles.text}>
        <SizedText size={fontSizes.medium} weight={fontWeights.semibold} numberOfLines={ValueConstants.one}>
          {entry.name}
        </SizedText>
        <SizedText size={fontSizes.small} muted numberOfLines={ValueConstants.one}>
          {portion}
        </SizedText>
        {macros === null ? null : (
          <SizedText size={fontSizes.small} muted numberOfLines={ValueConstants.one}>
            {macros}
          </SizedText>
        )}
      </View>
      <View style={styles.kcal}>
        <SizedText size={fontSizes.body} weight={fontWeights.bold}>
          {kcal}
        </SizedText>
        <SizedText size={fontSizes.micro} muted>
          {t().nutrition.kcal}
        </SizedText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: diarySizes.itemRowMinHeight,
    paddingVertical: spacing.sm2,
    paddingHorizontal: spacing.lg,
  },
  text: { flex: ValueConstants.one, gap: spacing.xxs },
  kcal: { alignItems: 'flex-end' },
});
