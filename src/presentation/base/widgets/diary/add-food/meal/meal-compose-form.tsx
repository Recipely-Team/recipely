import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ValueConstants } from '@core/constants';
import { isBlank } from '@core/guards/type-guards';
import { DiaryLimits } from '@domain/diary/diary-limits';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import type { MealLog } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface MealComposeFormProps {
  log: MealLog;
}

/**
 * The meal panel's first face: a description (up to 500 characters) or a
 * photo from the camera or library, and the line that says the values will
 * be estimates.
 */
export const MealComposeForm = ({ log }: MealComposeFormProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().diary;
  return (
    <ScrollView contentContainerStyle={styles.stack} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <SizedText size={fontSizes.caption} weight={fontWeights.semibold} muted>
        {strings.mealLogLabel}
      </SizedText>
      <AutoGrowTextInput
        value={log.text}
        onChangeText={log.setText}
        accessibilityLabel={strings.mealLogLabel}
        placeholder={strings.mealLogPlaceholder}
        placeholderTextColor={colors.textMuted}
        maxLength={DiaryLimits.MealTextMaxLength}
        minHeight={controlSizes.textArea}
        style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
      />
      <View style={styles.actions}>
        <Pressable
          onPress={log.pickPhoto}
          accessibilityRole="button"
          accessibilityLabel={strings.mealLogPhoto}
          style={[styles.photo, { backgroundColor: colors.chipBackground }]}
        >
          <Ionicons name="camera-outline" size={iconSizes.lg} color={colors.chipText} />
          <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.chipText}>
            {strings.mealLogPhoto}
          </SizedText>
        </Pressable>
        <View style={styles.find}>
          <PrimaryButton label={strings.mealLogFind} onPress={log.parseText} disabled={isBlank(log.text)} />
        </View>
      </View>
      {log.photoDenied ? (
        <SizedText size={fontSizes.caption} color={colors.danger} accessibilityLiveRegion="polite">
          {strings.mealLogPhotoDenied}
        </SizedText>
      ) : null}
      <SizedText size={fontSizes.small} muted>
        {strings.mealLogDisclaimer}
      </SizedText>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.sm, paddingTop: spacing.md },
  input: {
    fontSize: fontSizes.body,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  photo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
  },
  find: { flexGrow: ValueConstants.one },
});
