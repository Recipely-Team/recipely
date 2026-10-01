import { FlatList, Pressable, StyleSheet } from 'react-native';
import type { FoodCategory } from '@domain/diary/foods/food-category';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { ListConstants } from '@presentation/base/constants/list-constants';
import { borderWidths, diarySizes, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface CategoryChipsProps {
  categories: readonly FoodCategory[];
  /** null: every shelf. */
  selected: string | null;
  onSelect: (category: string | null) => void;
  /** The end of the row is near: the next page of shelves. */
  onEndReached: () => void;
}

/** The Products tab's shelves as a horizontal, paged chip row, "All" first. */
export const CategoryChips = ({ categories, selected, onSelect, onEndReached }: CategoryChipsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { isWebShell } = useLayout();
  const chips: readonly { key: string | null; name: string }[] = [{ key: null, name: t().diary.allShelves }, ...categories];
  return (
    <FlatList
      horizontal
      data={chips}
      keyExtractor={(chip) => chip.key ?? CharConstants.empty}
      onEndReached={onEndReached}
      onEndReachedThreshold={ListConstants.endReachedThreshold}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="radiogroup"
      renderItem={({ item }) => {
        const isSelected = item.key === selected;
        return (
          <Pressable
            onPress={() => onSelect(item.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            style={[
              styles.chip,
              { minHeight: isWebShell ? diarySizes.unitChipMinHeightWeb : diarySizes.unitChipMinHeight },
              isSelected
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <SizedText
              size={fontSizes.caption}
              weight={isSelected ? fontWeights.bold : fontWeights.semibold}
              color={isSelected ? colors.primaryText : colors.text}
              numberOfLines={ValueConstants.one}
            >
              {item.name}
            </SizedText>
          </Pressable>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  row: { gap: spacing.xs2, paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    justifyContent: 'center',
  },
});
