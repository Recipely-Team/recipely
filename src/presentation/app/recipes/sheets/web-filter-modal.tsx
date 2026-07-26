import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { WebFilterChip } from '@presentation/app/recipes/items/filters/web-filter-chip';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useTaxonomyOptions } from '@presentation/app/recipes/hooks/use-taxonomy-options';
import { difficultyLabel } from '@presentation/base/taxonomy/difficulty-label';
import type { UiFilters } from '@presentation/app/recipes/model/ui-filters';
import { TIME_OPTIONS } from '@presentation/app/recipes/model/ui-filter-defaults';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, iconSizes, controlSizes, layoutSizes, borderWidths, opacities, shadows } from '@presentation/base/theme';
import { DIFFICULTY_VALUES, type Difficulty } from '@domain/recipes/difficulty';
import { ValueConstants } from '@core/constants';

export interface WebFilterModalProps {
  visible: boolean;
  /** In-flight selection the chips drive (mirrors the screen's pending filters). */
  pending: UiFilters;
  /** Currently loaded result count (reflects applied filters + search, not the in-flight pending selection). */
  resultCount: number;
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
  resultCount,
  hasActiveFilters,
  onToggleCuisine,
  onToggleCategory,
  onToggleDifficulty,
  onSetMaxTime,
  onApply,
  onReset,
  onClose,
}: WebFilterModalProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { cuisineLabel, categoryLabel } = useTaxonomyLabel();
  const { cuisineKeys, categoryKeys } = useTaxonomyOptions();

  const applyLabel =
    resultCount > ValueConstants.zero ? `${t().recipes.showResults} (${resultCount})` : t().recipes.showResults;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.overlay, { backgroundColor: colors.scrim }]}
        accessibilityRole="button"
        accessibilityLabel={t().recipes.closeFilter}
        onPress={onClose}
      >
        {/* Stop propagation so taps inside the card don't dismiss the modal. */}
        <Pressable
          style={[styles.card, { backgroundColor: colors.background }, shadows.lg]}
          onPress={() => {}}
        >
          <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t().recipes.closeFilter}
              style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="close" size={iconSizes.xl} color={colors.text} />
            </Pressable>
            <ThemedText variant="subtitle" style={styles.title}>
              {t().recipes.filter}
            </ThemedText>
            <Pressable
              onPress={onReset}
              disabled={!hasActiveFilters}
              accessibilityRole="button"
              accessibilityLabel={t().recipes.clearFilters}
              accessibilityState={{ disabled: !hasActiveFilters }}
              style={!hasActiveFilters ? styles.clearDisabled : null}
            >
              <ThemedText
                variant="body"
                style={[
                  styles.clearLabel,
                  { color: hasActiveFilters ? colors.primary : colors.textMuted },
                ]}
              >
                {t().recipes.clearFilters}
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <ThemedText variant="caption" muted style={styles.sectionTitle}>
                {t().recipes.cuisine}
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
                {t().recipes.category}
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
                {t().recipes.difficulty}
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
                {t().recipes.maxTime}
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
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.cardBorder }]}>
            <PrimaryButton label={applyLabel} onPress={onApply} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: layoutSizes.webModalMaxWidth,
    maxHeight: '86%',
    borderRadius: radii.xxl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg2,
    paddingVertical: spacing.lg,
    borderBottomWidth: borderWidths.hairline,
  },
  closeBtn: {
    width: controlSizes.webModalClose,
    height: controlSizes.webModalClose,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: fontWeights.heavy,
  },
  clearDisabled: {
    opacity: opacities.disabled,
  },
  clearLabel: {
    fontWeight: fontWeights.bold,
  },
  body: {
    padding: spacing.xl,
    gap: spacing.lg2,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
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
  footer: {
    padding: spacing.lg,
    borderTopWidth: borderWidths.hairline,
  },
});
