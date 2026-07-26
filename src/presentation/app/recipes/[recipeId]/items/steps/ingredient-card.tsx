import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths, opacities } from '@presentation/base/theme';
import { parseIngredient } from '@presentation/app/recipes/[recipeId]/model/ingredients/parse-ingredient';
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
  const { qty, name } = parseIngredient(raw);
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
      <View
        style={[
          styles.checkbox,
          checked
            ? { backgroundColor: colors.success, borderColor: colors.success }
            : { backgroundColor: 'transparent', borderColor: colors.border },
        ]}
      >
        {checked ? (
          <Ionicons name="checkmark" size={iconSizes.sm} color={colors.onSuccess} />
        ) : null}
      </View>

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
  checkbox: {
    width: controlSizes.checkbox,
    height: controlSizes.checkbox,
    borderRadius: radii.sm,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
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
