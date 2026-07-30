import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, iconSizes, controlSizes, borderWidths } from '@presentation/base/theme';
import { ingredientGroupLabel } from '@domain/recipes/ingredients/ingredient-group-label';
import { INGREDIENT_GROUP_PREFIX } from '@domain/recipes/ingredients/ingredient-group-prefix';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface IngredientGroupRowProps {
  /** The raw line, marker and all — `# Şerbet`. */
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  removeLabel: string;
}

/**
 * Editable heading for one component of the recipe — the syrup of a dessert,
 * the filling of a cake.
 *
 * The field shows the LABEL while the model holds the marked line, so the user
 * types "Şerbet" and never has to know about the `#` that makes it a heading.
 * Styled as a heading rather than a bullet row so the structure is legible
 * while editing, not just after publishing.
 */
export const IngredientGroupRow = ({
  value,
  onChange,
  onRemove,
  removeLabel,
}: IngredientGroupRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const [focused, setFocused] = useState(false);

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
      <Ionicons name="pricetag-outline" size={iconSizes.sm} color={colors.primary} />
      <TextInput
        value={ingredientGroupLabel(value)}
        onChangeText={(label) => onChange(`${INGREDIENT_GROUP_PREFIX}${label}`)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={t().createRecipe.groupPlaceholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.primary }]}
      />
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
        hitSlop={spacing.sm}
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
    // Separates the group from the ingredients of the one above it, so the
    // structure is readable in the editor and not just after publishing.
    marginTop: spacing.sm,
  },
  input: {
    flex: ValueConstants.one,
    minHeight: controlSizes.iconBtn,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    paddingVertical: ValueConstants.zero,
  },
});
