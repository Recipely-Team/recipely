import { useMemo } from 'react';
import { TaxonomyPickerKind } from '@presentation/app/create-recipe/model/taxonomy-picker-kind';
import { StoreStatus } from '@application/store/store-status';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { useStores } from '@presentation/bootstrap/use-stores';
import type { TaxonomyItem } from '@domain/recipes/taxonomy/taxonomy-item';
import { CUISINE_KEY_VALUES } from '@domain/recipes/taxonomy/cuisine-key';
import { RECIPE_CATEGORY_VALUES } from '@domain/recipes/taxonomy/recipe-category';
import { CUISINE_EMOJI } from '@presentation/base/taxonomy/cuisine-emoji';
import { CATEGORY_EMOJI } from '@presentation/base/taxonomy/category-emoji';
import { TAXONOMY_PLACEHOLDER_EMOJI } from '@presentation/base/taxonomy/taxonomy-placeholder';
import type { Catalog } from '@presentation/app/create-recipe/model/taxonomy/catalog';
import { ValueConstants } from '@core/constants';

/**
 * `kind` selects which catalog (cuisine vs category) is shown. The emitted
 * value is the opaque taxonomy `key` (a `string`) — the backend catalog is
 * broader than the local enums, so the value is intentionally not narrowed.
 */
export interface TaxonomyPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  kind: TaxonomyPickerKind;
  selected: string | null;
  onSelect: (value: string) => void;
}

/** Width of one option cell — three per row once the gaps are taken out. */
const GRID_COLUMN_WIDTH = '31%' as const;

const localItems = (
  values: readonly string[],
  emoji: Record<string, string>,
  names: Record<string, string | undefined>,
): TaxonomyItem[] =>
  values.map((key) => ({
    key,
    name: names[key] ?? key,
    emoji: emoji[key] ?? TAXONOMY_PLACEHOLDER_EMOJI,
  }));

/**
 * Resolves the options to render: the backend taxonomy store list once it is
 * `ready`, otherwise the bundled local enum catalog (emoji maps + i18n names)
 * so the picker is never empty before the store loads, while offline, or on error.
 */
const useCatalog = (kind: TaxonomyPickerKind): Catalog => {
  const tr = t();
  const { taxonomyStore } = useStores();
  const status = taxonomyStore((s) => s.status);
  const cuisines = taxonomyStore((s) => s.cuisines);
  const categories = taxonomyStore((s) => s.categories);

  return useMemo(() => {
    const ready = status === StoreStatus.Ready;
    if (kind === TaxonomyPickerKind.Cuisine) {
      const items =
        ready && cuisines.length > ValueConstants.zero
          ? cuisines
          : localItems(CUISINE_KEY_VALUES, CUISINE_EMOJI, tr.cuisineNames);
      return { items, title: tr.createRecipe.pickCuisineTitle };
    }
    const items =
      ready && categories.length > ValueConstants.zero
        ? categories
        : localItems(RECIPE_CATEGORY_VALUES, CATEGORY_EMOJI, tr.categoryNames);
    return { items, title: tr.createRecipe.pickCategoryTitle };
  }, [kind, status, cuisines, categories, tr]);
};

/**
 * Bottom-sheet picker rendering a 3-column emoji grid for either the cuisine
 * or category catalog. The currently-selected option is highlighted; tapping
 * an option reports it back and closes the sheet.
 */
export const TaxonomyPickerSheet = (props: TaxonomyPickerSheetProps): React.JSX.Element => {
  const { visible, kind, selected, onClose } = props;
  const colors = useTheme().colors;
  const catalog = useCatalog(kind);

  const handleSelect = (key: string): void => {
    props.onSelect(key);
    onClose();
  };

  return (
    // Presented through the shared sheet, which is what decides
    // sheet-on-mobile / dialog-on-web. The grid is plain wrapped Views rather
    // than a FlatList: the sheet already scrolls its content, and a list
    // inside that scroller would fight it for the gesture.
    <BottomSheet visible={visible} title={catalog.title} onClose={onClose} showCloseButton>
      <View style={styles.grid}>
        {catalog.items.map((item) => {
          const active = item.key === selected;
          return (
            <Pressable
              key={item.key}
              onPress={() => handleSelect(item.key)}
              accessibilityRole="button"
              accessibilityLabel={item.name}
              style={[
                styles.option,
                {
                  backgroundColor: active ? colors.chipBackground : colors.surface,
                  borderColor: active ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <ThemedText style={styles.optionEmoji}>{item.emoji}</ThemedText>
              <ThemedText
                variant="caption"
                numberOfLines={ValueConstants.one}
                style={[styles.optionLabel, { color: active ? colors.primary : colors.text }]}
              >
                {item.name}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  option: {
    // Three per row: each cell takes a third of the row minus its share of the
    // two gaps between them.
    width: GRID_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
  },
  optionEmoji: {
    fontSize: fontSizes.title,
  },
  optionLabel: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
});
