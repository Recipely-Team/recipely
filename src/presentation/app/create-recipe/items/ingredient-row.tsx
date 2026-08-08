import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, iconSizes, controlSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface IngredientRowProps {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  removeLabel: string;
  /** Omitted for the first row in its group — there is nowhere up to go. */
  onMoveUp?: () => void;
  /** Omitted for the last row in its group. */
  onMoveDown?: () => void;
}

/**
 * Inline-editable ingredient row.
 *
 * @remarks
 * - **The field grows, it does not clip.** "2 tablespoons of the good olive
 *   oil, plus more for drizzling" is a normal ingredient and used to be cut off
 *   at one line by a pinned height.
 * - **Reordering is a pair of arrows, not a drag.** The design draws a drag
 *   handle; a real drag needs a gesture layer this list does not have yet, and
 *   arrows work with a screen reader, which a drag never has.
 */
export const IngredientRow = ({
  value,
  onChange,
  onRemove,
  removeLabel,
  onMoveUp,
  onMoveDown,
}: IngredientRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const [focused, setFocused] = useState(false);
  const canReorder = onMoveUp !== undefined || onMoveDown !== undefined;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: focused ? colors.chipBackground : 'transparent',
          borderColor: focused ? colors.primary : 'transparent',
        },
      ]}
    >
      {canReorder ? (
        <View style={styles.reorder}>
          <Pressable
            onPress={onMoveUp}
            disabled={onMoveUp === undefined}
            hitSlop={spacing.xs}
            style={onMoveUp === undefined ? styles.reorderDisabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={t().createRecipe.moveUp}
          >
            <Ionicons name="chevron-up" size={iconSizes.sm} color={colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={onMoveDown === undefined}
            hitSlop={spacing.xs}
            style={onMoveDown === undefined ? styles.reorderDisabled : undefined}
            accessibilityRole="button"
            accessibilityLabel={t().createRecipe.moveDown}
          >
            <Ionicons name="chevron-down" size={iconSizes.sm} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : (
        <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
      )}
      <AutoGrowTextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={t().createRecipe.ingredientPlaceholder}
        placeholderTextColor={colors.textMuted}
        minHeight={controlSizes.iconBtn}
        style={[styles.input, { color: colors.text }]}
      />
      <Pressable
        onPress={onRemove}
        hitSlop={spacing.sm}
        style={styles.removeBtn}
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
      >
        <Ionicons name="close" size={iconSizes.md} color={colors.textMuted} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm2,
    paddingVertical: spacing.xs2,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  bullet: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radii.round,
  },
  reorder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderDisabled: {
    opacity: opacities.disabled,
  },
  input: {
    flex: ValueConstants.one,
    fontSize: fontSizes.body,
  },
  removeBtn: {
    width: controlSizes.iconBtnSm,
    height: controlSizes.iconBtnSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
