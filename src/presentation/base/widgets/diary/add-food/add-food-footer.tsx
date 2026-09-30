import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { borderWidths, controlSizes, fontSizes, fontWeights, opacities, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface AddFoodFooterProps {
  isEdit: boolean;
  /** Kcal of the amount on the stepper, for the add button's label. */
  calories: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  onRemove: () => void;
}

/** The detail step's pinned actions: "Add to diary · 460 kcal", or Remove + Save changes when editing. */
export const AddFoodFooter = ({ isEdit, calories, isSubmitting, onSubmit, onRemove }: AddFoodFooterProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().diary;
  if (!isEdit) {
    return (
      <PrimaryButton
        label={strings.addToDiaryKcal.replace('{k}', formatWholeNumber(calories, locale))}
        onPress={onSubmit}
        loading={isSubmitting}
      />
    );
  }
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onRemove}
        disabled={isSubmitting}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.remove,
          { borderColor: colors.danger, backgroundColor: colors.dangerLight, opacity: pressed ? opacities.pressedSubtle : opacities.full },
        ]}
      >
        <SizedText size={fontSizes.body} weight={fontWeights.bold} color={colors.danger}>
          {strings.remove}
        </SizedText>
      </Pressable>
      <View style={styles.save}>
        <PrimaryButton label={strings.saveChanges} onPress={onSubmit} loading={isSubmitting} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  remove: {
    minHeight: controlSizes.button,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  save: { flex: ValueConstants.one },
});
