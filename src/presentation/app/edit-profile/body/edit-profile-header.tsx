import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface EditProfileHeaderProps {
  topInset: number;
  saveEnabled: boolean;
  isSaving: boolean;
  onBack: () => void;
  onSave: () => void;
}

/** Sticky top bar for the edit-profile screen: back, title, and save button. */
export const EditProfileHeader = ({
  topInset,
  saveEnabled,
  isSaving,
  onBack,
  onSave,
}: EditProfileHeaderProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View
      style={[
        styles.header,
        { paddingTop: topInset + spacing.sm, backgroundColor: colors.background, borderBottomColor: colors.border },
      ]}
    >
      <Pressable
        onPress={onBack}
        style={[styles.backBtn, { backgroundColor: colors.surface }]}
        accessibilityRole="button"
        accessibilityLabel={t().errors.back}
      >
        <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.text} />
      </Pressable>
      <ThemedText variant="subtitle" style={styles.headerTitle}>
        {t().editProfile.title}
      </ThemedText>
      <Pressable
        onPress={onSave}
        disabled={!saveEnabled}
        style={[styles.saveBtn, { backgroundColor: colors.primary }, saveEnabled ? null : styles.saveBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel={t().editProfile.save}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={colors.primaryText} />
        ) : (
          <ThemedText style={[styles.saveBtnLabel, { color: colors.primaryText }]}>
            {t().editProfile.save}
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: ValueConstants.one,
    fontWeight: fontWeights.bold,
  },
  saveBtn: {
    minWidth: controlSizes.saveBtnMinWidth,
    height: controlSizes.iconBtn,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: opacities.disabled,
  },
  saveBtnLabel: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.body,
  },
});
