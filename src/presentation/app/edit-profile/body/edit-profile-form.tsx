import { StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, controlSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { BIO_MAX } from '@presentation/app/edit-profile/model/edit-profile-limits';
import { DISPLAY_NAME_MAX } from '@presentation/base/forms/display-name-limits';

export interface EditProfileFormProps {
  displayName: string;
  onChangeName: (value: string) => void;
  showNameError: boolean;
  bio: string;
  onChangeBio: (value: string) => void;
  bioAtLimit: boolean;
}

/** Display-name + bio card of the edit-profile screen. */
export const EditProfileForm = ({
  displayName,
  onChangeName,
  showNameError,
  bio,
  onChangeBio,
  bioAtLimit,
}: EditProfileFormProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <View style={styles.field}>
        <ThemedText variant="caption" muted style={styles.label}>
          {t().editProfile.displayName.toUpperCase()}
        </ThemedText>
        <TextInput
          value={displayName}
          onChangeText={onChangeName}
          placeholder={t().editProfile.displayNamePlaceholder}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.background, borderColor: colors.cardBorder },
          ]}
          autoCapitalize="words"
          returnKeyType="done"
          maxLength={DISPLAY_NAME_MAX}
        />
        {showNameError ? (
          <ThemedText variant="caption" style={[styles.errorLine, { color: colors.danger }]}>
            {t().editProfile.displayNameRequired}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.field}>
        <ThemedText variant="caption" muted style={styles.label}>
          {t().editProfile.bio.toUpperCase()}
        </ThemedText>
        <AutoGrowTextInput
          value={bio}
          onChangeText={onChangeBio}
          placeholder={t().editProfile.bioPlaceholder}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            styles.textArea,
            { color: colors.text, backgroundColor: colors.background, borderColor: colors.cardBorder },
          ]}
          minHeight={controlSizes.messageField}
          maxLength={BIO_MAX}
        />
        <ThemedText
          variant="caption"
          muted={!bioAtLimit}
          style={[styles.counter, bioAtLimit ? { color: colors.danger } : null]}
        >
          {bio.length}/{BIO_MAX}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
  },
  input: {
    // minHeight, not height: a wrapped value or a larger OS font scale has to
    // be able to push the field taller instead of clipping inside it.
    minHeight: controlSizes.inputSm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.body,
  },
  textArea: {
    paddingTop: spacing.md,
  },
  errorLine: {
    fontWeight: fontWeights.semibold,
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: fontSizes.small,
  },
});
