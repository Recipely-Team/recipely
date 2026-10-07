import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { borderWidths, controlSizes, fontSizes, radii, spacing } from '@presentation/base/theme';
import type { UseShoppingItemEditorResult } from '@presentation/app/shopping-list/model/use-shopping-item-editor-result';
import { t } from '@presentation/i18n';

export interface ShoppingItemEditSheetProps {
  editor: UseShoppingItemEditorResult;
}

/**
 * Edits one line's name, amount and unit: a bottom sheet on a phone, a
 * centred dialog on the web shell (`BottomSheet`). A refused save keeps the
 * sheet open with the reason under the fields.
 */
export const ShoppingItemEditSheet = ({ editor }: ShoppingItemEditSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().shopping;
  const { fields, onChange } = editor;
  const field = (label: string, value: string, onText: (text: string) => void, keyboardType: KeyboardTypeOptions = 'default'): React.JSX.Element => (
    <View style={styles.field}>
      <ThemedText variant="caption" muted>
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onText}
        accessibilityLabel={label}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
      />
    </View>
  );
  return (
    <BottomSheet
      visible={editor.editing !== null}
      title={copy.editTitle}
      onClose={editor.close}
      showCloseButton
      footer={<PrimaryButton label={copy.save} onPress={editor.save} loading={editor.isSaving} />}
    >
      {field(copy.labelField, fields.label, (label) => onChange({ ...fields, label }))}
      <View style={styles.pair}>
        <View style={styles.half}>{field(copy.quantityField, fields.quantityText, (quantityText) => onChange({ ...fields, quantityText }), 'decimal-pad')}</View>
        <View style={styles.half}>{field(copy.unitField, fields.unit, (unit) => onChange({ ...fields, unit }))}</View>
      </View>
      {editor.error === null ? null : (
        <ThemedText variant="caption" accessibilityLiveRegion="polite" style={{ color: colors.danger }}>
          {editor.error}
        </ThemedText>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  field: { gap: spacing.xs, marginBottom: spacing.md },
  input: {
    minHeight: controlSizes.searchBar,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.body,
    borderRadius: radii.md,
    borderWidth: borderWidths.hairline,
  },
  pair: { flexDirection: 'row', gap: spacing.md },
  half: { flex: ValueConstants.one },
});
