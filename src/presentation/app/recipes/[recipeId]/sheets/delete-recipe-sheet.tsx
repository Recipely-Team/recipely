import { Pressable, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { spacing, radii, fontSizes, fontWeights, lineHeightFor, controlSizes, opacities } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface DeleteRecipeSheetProps {
  visible: boolean;
  deleteError: string | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation sheet for deleting an owned recipe. The delete failure is shown
 * inline inside this (still-open) sheet rather than as a toast — a global toast
 * would be occluded by the modal sheet.
 */
export const DeleteRecipeSheet = ({
  visible,
  deleteError,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteRecipeSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <BottomSheet
      visible={visible}
      title={t().myRecipes.deleteConfirmTitle}
      onClose={onClose}
    >
      <ThemedText variant="body" muted style={styles.deleteSheetBody}>
        {t().myRecipes.deleteConfirm}
      </ThemedText>
      {deleteError !== null ? (
        <ThemedText variant="caption" style={[styles.deleteSheetError, { color: colors.danger }]}>
          {deleteError}
        </ThemedText>
      ) : null}
      <View style={styles.deleteSheetActions}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.deleteSheetBtn,
            { backgroundColor: colors.surface, opacity: pressed ? opacities.pressed : opacities.full },
          ]}
        >
          <ThemedText variant="body" style={styles.semiBold}>
            {t().common.cancel}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          disabled={isDeleting}
          style={({ pressed }) => [
            styles.deleteSheetBtn,
            styles.deleteSheetBtnDanger,
            { opacity: pressed || isDeleting ? opacities.pressedStrong : opacities.full, backgroundColor: colors.dangerLight },
          ]}
        >
          <ThemedText variant="body" style={[styles.deleteSheetBtnDangerLabel, styles.semiBold, { color: colors.danger }]}>
            {isDeleting ? t().common.loading : t().myRecipes.deleteRecipe}
          </ThemedText>
        </Pressable>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  deleteSheetBody: {
    marginBottom: spacing.md,
    lineHeight: lineHeightFor(fontSizes.body),
  },
  deleteSheetError: {
    marginBottom: spacing.md,
  },
  deleteSheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  deleteSheetBtn: {
    flex: ValueConstants.one,
    minHeight: controlSizes.buttonSm,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSheetBtnDanger: {},
  deleteSheetBtnDangerLabel: {},
  semiBold: {
    fontWeight: fontWeights.semibold,
  },
});
