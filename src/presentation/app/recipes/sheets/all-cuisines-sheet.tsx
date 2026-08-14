import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useTaxonomyOptions } from '@presentation/app/recipes/hooks/use-taxonomy-options';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, decorSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface AllCuisinesSheetProps {
  visible: boolean;
  selectedCuisines: string[];
  onToggle: (cuisine: string) => void;
  onClear: () => void;
  onClose: () => void;
}

/**
 * The whole cuisine catalogue, behind the rail's one button.
 *
 * @remarks
 * - **This is where completeness lives**, which is what frees the rail from
 *   having to grow with the catalogue. Forty items are searchable rather than
 *   scrolled past, and the selection is multiple.
 * - Presented through {@link BottomSheet}, so it is a sheet on a phone and a
 *   centred dialog once the viewport is expanded — the app-wide rule, decided
 *   in one place rather than here.
 * - The design groups the catalogue by region. The backend taxonomy carries no
 *   region, so this lists them flat with a search instead of inventing a
 *   grouping the data cannot back.
 */
export const AllCuisinesSheet = ({
  visible,
  selectedCuisines,
  onToggle,
  onClear,
  onClose,
}: AllCuisinesSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { cuisineLabel } = useTaxonomyLabel();
  const { cuisineKeys } = useTaxonomyOptions();
  const [query, setQuery] = useState(CharConstants.empty);

  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (needle.length === ValueConstants.zero) return cuisineKeys;
    return cuisineKeys.filter((key) => cuisineLabel(key).name.toLocaleLowerCase().includes(needle));
  }, [cuisineKeys, cuisineLabel, query]);

  const footer = (
    <View style={styles.footer}>
      <ThemedText style={[styles.count, { color: colors.textMuted }]}>
        {t().recipes.cuisinesSelected.replace('{n}', String(selectedCuisines.length))}
      </ThemedText>
      <Pressable
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel={t().common.clear}
        style={[styles.clear, { borderColor: colors.border }]}
      >
        <ThemedText style={[styles.clearLabel, { color: colors.textMuted }]}>{t().common.clear}</ThemedText>
      </Pressable>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t().common.apply}
        style={[styles.apply, { backgroundColor: colors.primary }]}
      >
        <ThemedText style={[styles.applyLabel, { color: colors.primaryText }]}>{t().common.apply}</ThemedText>
      </Pressable>
    </View>
  );

  return (
    <BottomSheet visible={visible} title={t().recipes.allCuisines} onClose={onClose} footer={footer}>
      <View style={[styles.search, { backgroundColor: colors.cardBackground, borderColor: colors.inputBorder }]}>
        <Ionicons name="search" size={iconSizes.md} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t().recipes.searchCuisine}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <View style={styles.wrap}>
        {matches.map((key) => {
          const { name, emoji } = cuisineLabel(key);
          const active = selectedCuisines.includes(key);
          return (
            <Pressable
              key={key}
              onPress={() => onToggle(key)}
              accessibilityRole="button"
              accessibilityLabel={name}
              style={[
                styles.chip,
                active
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: active ? colors.gradientSurface : colors.cardBackground }]}>
                <ThemedText style={styles.emoji}>{emoji}</ThemedText>
              </View>
              <ThemedText style={[styles.chipLabel, { color: active ? colors.primaryText : colors.text }]}>
                {name}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.searchBar,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: ValueConstants.one,
    fontSize: fontSizes.medium,
    paddingVertical: ValueConstants.zero,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.chip,
    paddingLeft: spacing.xs2,
    paddingRight: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
  },
  dot: {
    width: decorSizes.badgeSm,
    height: decorSizes.badgeSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: fontSizes.caption,
  },
  chipLabel: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.caption,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm2,
  },
  count: {
    flex: ValueConstants.one,
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.caption,
  },
  clear: {
    minHeight: controlSizes.chip,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearLabel: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.caption,
  },
  apply: {
    minHeight: controlSizes.chip,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyLabel: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.caption,
  },
});
