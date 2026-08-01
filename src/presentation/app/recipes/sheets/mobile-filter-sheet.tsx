import { StyleSheet, View } from 'react-native';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { SelectChip } from '@presentation/app/recipes/items/filters/select-chip';
import { sortKeyLabels } from '@presentation/app/recipes/model/sorting/recipe-sort';
import { SortKey } from '@presentation/app/recipes/model/sorting/sort-key';
import { formatLabel } from '@presentation/app/recipes/model/format-label';
import type { UiFilters } from '@presentation/app/recipes/model/filtering/ui-filters';
import { TIME_OPTIONS } from '@presentation/app/recipes/model/filtering/ui-filter-defaults';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useTaxonomyOptions } from '@presentation/app/recipes/hooks/use-taxonomy-options';
import { t } from '@presentation/i18n';
import { spacing } from '@presentation/base/theme';
import { DIFFICULTY_VALUES, type Difficulty } from '@domain/recipes/difficulty';
import { ValueConstants } from '@core/constants';

export interface MobileFilterSheetProps {
  visible: boolean;
  activeFilterCount: number;
  pendingFilters: UiFilters;
  pendingSort: SortKey;
  onSelectSort: (key: SortKey) => void;
  onToggleCuisine: (cuisine: string) => void;
  onToggleCategory: (category: string) => void;
  onToggleDifficulty: (difficulty: Difficulty) => void;
  onSetMaxTime: (minutes: number) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}

/**
 * Mobile filter bottom sheet: sort + cuisine / category / difficulty / max-time
 * chips, applied together via "Show results". The web shell uses the centered
 * `WebFilterModal` instead; this sheet is only opened on the native shell.
 */
export const MobileFilterSheet = ({
  visible,
  activeFilterCount,
  pendingFilters,
  pendingSort,
  onSelectSort,
  onToggleCuisine,
  onToggleCategory,
  onToggleDifficulty,
  onSetMaxTime,
  onApply,
  onReset,
  onClose,
}: MobileFilterSheetProps): React.JSX.Element => {
  const { cuisineLabel, categoryLabel } = useTaxonomyLabel();
  const { cuisineKeys, categoryKeys } = useTaxonomyOptions();
  const sortLabels = sortKeyLabels();

  return (
    <BottomSheet
      visible={visible}
      title={t().recipes.filter}
      onClose={onClose}
      rightAction={
        activeFilterCount > ValueConstants.zero
          ? { label: t().recipes.clearFilters, onPress: onReset }
          : undefined
      }
      // Pinned, not the last child of the scroll: five chip sections are taller
      // than the sheet's 78% cap, so a CTA in the body sat below the fold and
      // went unnoticed — the user had to scroll the whole sheet to apply.
      footer={<PrimaryButton label={t().recipes.showResults} onPress={onApply} />}
    >
      <View style={styles.sheetSection}>
        <ThemedText variant="label" muted style={styles.sheetSectionTitle}>
          {t().recipes.sortBy}
        </ThemedText>
        <View style={styles.chipsWrap}>
          {(Object.keys(sortLabels) as SortKey[]).map((key) => (
            <SelectChip
              key={key}
              label={sortLabels[key]}
              selected={pendingSort === key}
              onToggle={() => onSelectSort(key)}
            />
          ))}
        </View>
      </View>

      <View style={styles.sheetSection}>
        <ThemedText variant="label" muted style={styles.sheetSectionTitle}>
          {t().recipes.cuisine}
        </ThemedText>
        <View style={styles.chipsWrap}>
          {cuisineKeys.map((c) => (
            <SelectChip
              key={c}
              label={cuisineLabel(c).name}
              selected={pendingFilters.cuisines.includes(c)}
              onToggle={() => onToggleCuisine(c)}
            />
          ))}
        </View>
      </View>

      <View style={styles.sheetSection}>
        <ThemedText variant="label" muted style={styles.sheetSectionTitle}>
          {t().recipes.category}
        </ThemedText>
        <View style={styles.chipsWrap}>
          {categoryKeys.map((c) => (
            <SelectChip
              key={c}
              label={categoryLabel(c).name}
              selected={pendingFilters.categories.includes(c)}
              onToggle={() => onToggleCategory(c)}
            />
          ))}
        </View>
      </View>

      <View style={styles.sheetSection}>
        <ThemedText variant="label" muted style={styles.sheetSectionTitle}>
          {t().recipes.difficulty}
        </ThemedText>
        <View style={styles.chipsRow}>
          {DIFFICULTY_VALUES.map((d) => (
            <SelectChip
              key={d}
              label={formatLabel(d)}
              selected={pendingFilters.difficulties.includes(d)}
              onToggle={() => onToggleDifficulty(d)}
              flex
            />
          ))}
        </View>
      </View>

      <View style={styles.sheetSection}>
        <ThemedText variant="label" muted style={styles.sheetSectionTitle}>
          {t().recipes.maxTime}
        </ThemedText>
        <View style={styles.chipsWrap}>
          {TIME_OPTIONS.map((m) => (
            <SelectChip
              key={m}
              label={m === ValueConstants.zero ? t().recipes.any : `≤ ${m} ${t().recipes.minutes}`}
              selected={pendingFilters.maxTime === m}
              onToggle={() => onSetMaxTime(m)}
            />
          ))}
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetSection: {
    marginBottom: spacing.lg,
  },
  sheetSectionTitle: {
    marginBottom: spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs2,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.xs2,
  },
});
