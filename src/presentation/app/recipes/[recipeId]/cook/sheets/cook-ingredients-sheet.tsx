import { StyleSheet, View } from 'react-native';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface CookIngredientsSheetProps {
  visible: boolean;
  ingredients: readonly string[];
  onClose: () => void;
}

/**
 * The ingredient list, a glance away from the step: a bottom sheet on a phone,
 * a centred dialog on the web shell (both `BottomSheet`).
 *
 * The lines as the recipe holds them; ticking ingredients off stays on the
 * recipe page, where the shopping happens.
 */
export const CookIngredientsSheet = ({ visible, ingredients, onClose }: CookIngredientsSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <BottomSheet visible={visible} title={t().cookMode.ingredients} onClose={onClose} showCloseButton>
      {ingredients.map((line, i) => (
        <View
          // Lines repeat ("salt"); position disambiguates in a list that never reorders.
          key={`${String(i)}:${line}`}
          style={[styles.row, { borderBottomColor: colors.cardBorder }]}
        >
          <ThemedText variant="body" style={{ color: colors.text }}>
            {line}
          </ThemedText>
        </View>
      ))}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: borderWidths.hairline,
  },
});
