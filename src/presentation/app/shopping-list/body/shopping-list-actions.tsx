import { Pressable, StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, controlSizes, fontSizes, fontWeights, opacities, radii, spacing } from '@presentation/base/theme';
import { ShoppingConfirm, type ShoppingConfirmType } from '@presentation/app/shopping-list/model/shopping-confirm';
import { t } from '@presentation/i18n';

export interface ShoppingListActionsProps {
  checkedCount: number;
  itemCount: number;
  onAsk: (confirm: ShoppingConfirmType) => void;
}

/** "Clear completed" (only while something is ticked) and "Clear all" (only while there is anything), each asking first. */
export const ShoppingListActions = ({ checkedCount, itemCount, onAsk }: ShoppingListActionsProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  if (itemCount === ValueConstants.zero) return null;
  const copy = t().shopping;
  const pill = (label: string, confirm: ShoppingConfirmType, color: string): React.JSX.Element => (
    <Pressable
      onPress={() => onAsk(confirm)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.pill,
        { borderColor: colors.cardBorder, backgroundColor: colors.surface, opacity: pressed ? opacities.pressed : opacities.full },
      ]}
    >
      <SizedText size={fontSizes.caption} weight={fontWeights.semibold} color={color}>
        {label}
      </SizedText>
    </Pressable>
  );
  return (
    <View style={styles.row}>
      {checkedCount > ValueConstants.zero ? pill(copy.clearCompleted, ShoppingConfirm.ClearChecked, colors.text) : null}
      {pill(copy.clearAll, ShoppingConfirm.ClearAll, colors.danger)}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.sm },
  pill: {
    minHeight: controlSizes.touchTarget,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
});
