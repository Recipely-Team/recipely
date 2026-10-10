import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type NativeSyntheticEvent, type TextInputKeyPressEventData } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, fontSizes, fontWeights, fridgeSizes, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { FridgeLimits } from '@domain/fridge/fridge-limits';
import { CharConstants } from '@core/constants';
import { isBlank } from '@core/guards/type-guards';

export interface AddIngredientChipProps {
  /** Opens already as a field — "Type them instead" lands here. */
  startOpen: boolean;
  dense: boolean;
  onAdd: (name: string) => void;
}

const ESCAPE_KEY = 'Escape';

/**
 * "+ Add": a dashed `primary` chip that turns into an inline field with an
 * Add pill. Enter adds and keeps the field open for the next one; Escape (or
 * an empty submit) closes it.
 */
export const AddIngredientChip = ({ startOpen, dense, onAdd }: AddIngredientChipProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().fridge;
  const [open, setOpen] = useState(startOpen);
  const [text, setText] = useState(CharConstants.empty);
  const minHeight = dense ? fridgeSizes.chipExpanded : fridgeSizes.chip;

  const close = (): void => {
    setText(CharConstants.empty);
    setOpen(false);
  };
  const submit = (): void => {
    if (isBlank(text)) return close();
    onAdd(text);
    setText(CharConstants.empty);
  };
  const onKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>): void => {
    if (event.nativeEvent.key === ESCAPE_KEY) close();
  };

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={copy.addIngredient}
        style={[styles.chip, styles.dashed, { minHeight, borderColor: colors.primary }]}
      >
        <Ionicons name="add" size={iconSizes.md} color={colors.primary} />
        <SizedText size={fontSizes.medium} weight={fontWeights.semibold} color={colors.primary}>
          {copy.add}
        </SizedText>
      </Pressable>
    );
  }

  return (
    <View style={[styles.chip, styles.field, { minHeight, borderColor: colors.inputBorderFocused, backgroundColor: colors.surface }]}>
      <TextInput
        autoFocus
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        onKeyPress={onKeyPress}
        onBlur={() => (isBlank(text) ? close() : undefined)}
        submitBehavior="submit"
        returnKeyType="done"
        maxLength={FridgeLimits.ingredientNameMax}
        placeholder={copy.addPlaceholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={copy.addIngredient}
        style={[styles.input, { color: colors.text }]}
      />
      <Pressable onPress={submit} accessibilityRole="button" accessibilityLabel={copy.add} style={[styles.pill, { backgroundColor: colors.primary }]}>
        <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.primaryText}>
          {copy.add}
        </SizedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
  },
  dashed: {
    borderWidth: borderWidths.thin,
    borderStyle: 'dashed',
  },
  field: {
    borderWidth: borderWidths.thin,
    paddingRight: spacing.xs,
  },
  input: {
    width: fridgeSizes.addInputWidth,
    fontSize: fontSizes.medium,
    paddingVertical: spacing.xs,
  },
  pill: {
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
