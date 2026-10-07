import { Pressable, StyleSheet, View } from 'react-native';
import { CharConstants, ValueConstants } from '@core/constants';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import { shoppingAmountText } from '@domain/shopping/items/shopping-amount-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { TickBox } from '@presentation/base/widgets/inputs/tick-box';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { borderWidths, controlSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ShoppingCopyToken } from '@presentation/app/shopping-list/model/shopping-copy-token';

export interface ShoppingItemRowProps {
  item: ShoppingItemEntity;
  onToggle: (item: ShoppingItemEntity) => void;
  onEdit: (item: ShoppingItemEntity) => void;
  onRemove: (item: ShoppingItemEntity) => void;
}

/**
 * One line of the list: a tick, the name with its amount, the recipe it came
 * from, and edit / remove. The whole left part is the tick's target, so a
 * shopper with one free hand does not have to aim for the box.
 */
export const ShoppingItemRow = ({ item, onToggle, onEdit, onRemove }: ShoppingItemRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().shopping;
  const amount = shoppingAmountText(item.quantity, item.unit, t().recipes.portions.decimalMark);
  const muted = item.checked ? colors.textMuted : colors.text;
  return (
    <View style={[styles.row, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <Pressable
        onPress={() => onToggle(item)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked }}
        accessibilityLabel={(item.checked ? copy.uncheck : copy.check).replace(ShoppingCopyToken.name, item.label)}
        style={({ pressed }) => [styles.tick, { opacity: pressed ? opacities.pressed : opacities.full }]}
      >
        <TickBox checked={item.checked} />
        <View style={styles.text}>
          <ThemedText variant="body" style={[{ color: muted }, item.checked ? styles.done : null]}>
            {amount.length > ValueConstants.zero ? `${amount}${CharConstants.middotSpaced}${item.label}` : item.label}
          </ThemedText>
          {item.recipeName === null ? null : (
            <ThemedText variant="caption" muted numberOfLines={ValueConstants.one}>
              {copy.fromRecipe.replace(ShoppingCopyToken.name, item.recipeName)}
            </ThemedText>
          )}
        </View>
      </Pressable>
      <RoundIconButton
        icon="create-outline"
        accessibilityLabel={copy.edit.replace(ShoppingCopyToken.name, item.label)}
        onPress={() => onEdit(item)}
        size={controlSizes.touchTarget}
      />
      <RoundIconButton
        icon="trash-outline"
        accessibilityLabel={copy.remove.replace(ShoppingCopyToken.name, item.label)}
        onPress={() => onRemove(item)}
        size={controlSizes.touchTarget}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  tick: {
    flex: ValueConstants.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: controlSizes.touchTarget,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
  },
  text: { flex: ValueConstants.one, minWidth: ValueConstants.zero, gap: spacing.xxs },
  done: { textDecorationLine: 'line-through' },
});
