import { Pressable, StyleSheet, View } from 'react-native';
import type { MealGroup } from '@domain/diary/day/meal-group';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { MealSlotType } from '@domain/diary/meal-slot';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { mealLabel } from '@presentation/base/utils/diary/meal-label';
import {
  borderWidths,
  controlSizes,
  fontSizes,
  fontWeights,
  opacities,
  radii,
  shadows,
  spacing,
} from '@presentation/base/theme';
import { MealEntryRow } from '@presentation/app/diary/items/meal-entry-row';
import { EmptyMealButton } from '@presentation/app/diary/items/empty-meal-button';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface MealCardProps {
  group: MealGroup;
  onAdd: (meal: MealSlotType) => void;
  onEdit: (entry: FoodLogEntryEntity) => void;
}

/** One meal of the day: its name and kcal, its foods, and a way to add more (design spec → Food Diary §4). */
export const MealCard = ({ group, onAdd, onEdit }: MealCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const name = mealLabel(group.meal);
  const hasItems = group.entries.length > ValueConstants.zero;
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <View style={styles.title}>
          <SizedText accessibilityRole="header" size={fontSizes.heading} weight={fontWeights.bold}>
            {name}
          </SizedText>
          <SizedText size={fontSizes.caption} muted>
            {`${formatWholeNumber(group.totals.calories, locale)} ${t().nutrition.kcal}`}
          </SizedText>
        </View>
        {hasItems ? (
          <Pressable
            onPress={() => onAdd(group.meal)}
            hitSlop={spacing.xs2}
            accessibilityRole="button"
            accessibilityLabel={t().diary.addToMeal.replace('{meal}', name)}
            style={({ pressed }) => [
              styles.addPill,
              { backgroundColor: colors.chipBackground, opacity: pressed ? opacities.pressedSubtle : opacities.full },
            ]}
          >
            <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.chipText}>
              {`+ ${t().diary.add}`}
            </SizedText>
          </Pressable>
        ) : null}
      </View>
      {hasItems ? (
        group.entries.map((entry, i) => (
          <View key={entry.id} style={i > ValueConstants.zero ? [styles.separated, { borderTopColor: colors.cardBorder }] : null}>
            <MealEntryRow entry={entry} onPress={onEdit} />
          </View>
        ))
      ) : (
        <EmptyMealButton mealName={name} onPress={() => onAdd(group.meal)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    ...shadows.sm,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexShrink: ValueConstants.one },
  addPill: {
    minHeight: controlSizes.iconBtnSm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separated: { borderTopWidth: StyleSheet.hairlineWidth },
});
