import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, borderWidths, opacities } from '@presentation/base/theme';
import { TickBox } from '@presentation/base/widgets/inputs/tick-box';
import { IngredientLine } from '@domain/recipes/ingredients/ingredient-line';
import { ValueConstants } from '@core/constants';

export interface IngredientCardProps {
  raw: string;
  checked: boolean;
  onToggle: () => void;
}

/** Tappable ingredient row with parsed quantity chip and strikethrough-on-check behaviour. */
export const IngredientCard = ({
  raw,
  checked,
  onToggle,
}: IngredientCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { qty, name } = IngredientLine.of(raw).split();
  const display = name.length > ValueConstants.zero ? name : raw;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          opacity: checked ? opacities.disabledFaint : opacities.full,
        },
      ]}
    >
      <TickBox checked={checked} />

      {qty.length > ValueConstants.zero ? (
        <View style={[styles.qtyChip, { backgroundColor: colors.chipBackground }]}>
          <ThemedText
            variant="caption"
            style={[styles.qtyText, { color: colors.chipText }]}
          >
            {qty}
          </ThemedText>
        </View>
      ) : null}

      <ThemedText
        variant="body"
        style={[
          styles.name,
          {
            color: checked ? colors.textMuted : colors.text,
            textDecorationLine: checked ? 'line-through' : 'none',
          },
        ]}
      >
        {display}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  qtyChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
  },
  qtyText: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.small,
  },
  name: {
    flex: ValueConstants.one,
  },
});
