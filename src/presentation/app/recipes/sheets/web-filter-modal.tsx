import { StyleSheet, View } from 'react-native';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { WebFilterChip } from '@presentation/app/recipes/items/filters/web-filter-chip';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useTaxonomyOptions } from '@presentation/app/recipes/hooks/use-taxonomy-options';
import { difficultyLabel } from '@presentation/base/taxonomy/difficulty-label';
import type { UiFilters } from '@presentation/app/recipes/model/filtering/ui-filters';
import { TIME_OPTIONS } from '@presentation/app/recipes/model/filtering/ui-filter-defaults';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import { spacing, fontSizes, fontWeights, letterSpacings, layoutSizes } from '@presentation/base/theme';
import { DIFFICULTY_VALUES, type Difficulty } from '@domain/recipes/difficulty';
import { ValueConstants } from '@core/constants';

export interface WebFilterModalProps {
  visible: boolean;
  /** In-flight selection the chips drive (mirrors the screen's pending filters). */
  pending: UiFilters;

  /** Whether any filter is currently active (enables/disables Clear). */
  hasActiveFilters: boolean;
  onToggleCuisine: (key: string) => void;
  onToggleCategory: (key: string) => void;
  onToggleDifficulty: (value: Difficulty) => void;
  onSetMaxTime: (minutes: number) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}

/**
 * Centered web-only filter dialog (the mobile shell keeps its bottom sheet).
 * Renders cuisine / category / difficulty / max-time chip sections over a
 * slate scrim; the scrim and the close button dismiss it, and the footer button
 * applies the selection.
 */
export const WebFilterModal = ({
  visible,
  pending,
  hasActiveFilters,
  onToggleCuisine,
  onToggleCategory,
  onToggleDifficulty,
  onSetMaxTime,
  onApply,
  onReset,
  onClose,
}: WebFilterModalProps): React.JSX.Element => {
  const { cuisineLabel, categoryLabel } = useTaxonomyLabel();
  const { cuisineKeys, categoryKeys } = useTaxonomyOptions();

  // No count: the one at hand was for the filters already applied, not the ones being edited.
  const applyLabel = t().recipes.showResults;

  return (
    <BottomSheet
      visible={visible}
      title={t().recipes.filter}
      onClose={onClose}
      showCloseButton
      rightAction={hasActiveFilters ? { label: t().recipes.clearFilters, onPress: onReset } : undefined}
      dialogMaxWidth={layoutSizes.webModalMaxWidth}
      footer={<PrimaryButton label={applyLabel} onPress={onApply} />}
    >
      <View style={styles.body}>
        <View style={styles.section}>
          <ThemedText variant="caption" muted style={styles.sectionTitle}>
            {upperCase(t().recipes.cuisine)}
          </ThemedText>
          <View style={styles.chipsWrap}>
            {cuisineKeys.map((c) => (
              <WebFilterChip
                key={c}
                label={cuisineLabel(c).name}
                active={pending.cuisines.includes(c)}
                onToggle={() => onToggleCuisine(c)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText variant="caption" muted style={styles.sectionTitle}>
            {upperCase(t().recipes.category)}
          </ThemedText>
          <View style={styles.chipsWrap}>
            {categoryKeys.map((c) => (
              <WebFilterChip
                key={c}
                label={categoryLabel(c).name}
                active={pending.categories.includes(c)}
                onToggle={() => onToggleCategory(c)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText variant="caption" muted style={styles.sectionTitle}>
            {upperCase(t().recipes.difficulty)}
          </ThemedText>
          <View style={styles.chipsRow}>
            {DIFFICULTY_VALUES.map((d) => (
              <WebFilterChip
                key={d}
                label={difficultyLabel(d)}
                active={pending.difficulties.includes(d)}
                onToggle={() => onToggleDifficulty(d)}
                grow
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText variant="caption" muted style={styles.sectionTitle}>
            {upperCase(t().recipes.maxTime)}
          </ThemedText>
          <View style={styles.chipsWrap}>
            {TIME_OPTIONS.map((m) => (
              <WebFilterChip
                key={m}
                label={m === ValueConstants.zero ? t().recipes.any : `≤ ${m} ${t().recipes.minutes}`}
                active={pending.maxTime === m}
                onToggle={() => onSetMaxTime(m)}
              />
            ))}
          </View>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg2,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
