import { useMemo } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths } from '@presentation/base/theme';
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
  kind: 'cuisine' | 'category';
  selected: string | null;
  onSelect: (value: string) => void;
}

const GRID_COLUMNS = 3;

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
const useCatalog = (kind: 'cuisine' | 'category'): Catalog => {
  const tr = t();
  const { taxonomyStore } = useStores();
  const status = taxonomyStore((s) => s.status);
  const cuisines = taxonomyStore((s) => s.cuisines);
  const categories = taxonomyStore((s) => s.categories);

  return useMemo(() => {
    const ready = status === 'ready';
    if (kind === 'cuisine') {
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
  const insets = useSafeAreaInsets();
  const catalog = useCatalog(kind);

  const handleSelect = (key: string): void => {
    props.onSelect(key);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.background, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <View style={styles.header}>
          <ThemedText variant="title">{catalog.title}</ThemedText>
          <Pressable
            onPress={onClose}
            hitSlop={spacing.sm}
            style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel={t().common.cancel}
          >
            <Ionicons name="close" size={iconSizes.md} color={colors.text} />
          </Pressable>
        </View>
        <FlatList
          data={catalog.items}
          numColumns={GRID_COLUMNS}
          keyExtractor={(item) => item.key}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = item.key === selected;
            return (
              <Pressable
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
                  numberOfLines={1}
                  style={[styles.optionLabel, { color: active ? colors.primary : colors.text }]}
                >
                  {item.name}
                </ThemedText>
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: ValueConstants.one,
  },
  sheet: {
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxHeight: '78%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  closeBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  row: {
    gap: spacing.sm,
  },
  option: {
    flex: ValueConstants.one,
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
