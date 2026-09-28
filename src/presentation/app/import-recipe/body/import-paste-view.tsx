import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { failureContent, failureIcon, failureSeverity } from '@presentation/base/errors/failure-lookups';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { spacing, radii, fontWeights, iconSizes, controlSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ImportPasteSteps } from '@presentation/app/import-recipe/body/import-paste-steps';
import { ImportPasteLead } from '@presentation/app/import-recipe/body/import-paste-lead';
import { usePasteImportLink } from '@presentation/app/import-recipe/hooks/use-paste-import-link';
import { ValueConstants } from '@core/constants';
import { ImportPasteField } from '@presentation/app/import-recipe/body/import-paste-field';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';

export interface ImportPasteViewProps {
  /** Hands back a validated video or recipe-page URL to queue. */
  onSubmit: (url: string) => void;
  onCancel: () => void;
}

/**
 * Import by pasting a link — the entry that does not depend on the OS.
 *
 * @remarks
 * - **The path that works everywhere.** The share sheet only exists on the
 *   phone, and never on the web: copy the link in the video's app or the
 *   browser, paste it here.
 * - **The three-step card is not decoration** — "Copy link" is buried in
 *   Instagram's ⋯ menu, and a user who cannot find it cannot use the feature.
 * - **A recognised link shows its platform's glyph in the field**, in the same
 *   white seal a recipe card wears, so the user sees WHICH link was understood.
 * - **One message under the field at a time.** An error outranks the paste
 *   hint: "paste it into the field" beside "that link didn't work" is two
 *   instructions for one problem.
 */
export const ImportPasteView = ({ onSubmit, onCancel }: ImportPasteViewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const scrollable = useAssistantScrollable();
  const copy = t().importRecipe;
  const vm = usePasteImportLink();
  const recognised = vm.failure === null ? vm.recognised : null;
  const danger = useSeveritySurfaces().danger;

  const handleSubmit = (): void => {
    const url = vm.submit();
    if (url !== null) onSubmit(url);
  };

  return (
    <ScrollView
      {...scrollable}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Pressable
          onPress={onCancel}
          style={[styles.closeBtn, { backgroundColor: colors.surface }]}
          accessibilityRole="button"
          accessibilityLabel={t().common.cancel}
        >
          <Ionicons name="close" size={iconSizes.lg} color={colors.text} />
        </Pressable>
        <ThemedText variant="subtitle">{copy.pasteTitle}</ThemedText>
      </View>

      <ImportPasteLead />

      <ThemedText variant="label" style={[styles.label, { color: colors.textMuted }]}>
        {copy.pasteLabel}
      </ThemedText>

      <ImportPasteField
        value={vm.value}
        onChangeValue={vm.onChangeValue}
        onBlur={vm.onBlur}
        onSubmit={handleSubmit}
        onPaste={vm.onPaste}
        recognised={recognised}
        hasFailure={vm.failure !== null}
      />

      {recognised !== null ? (
        <View style={styles.hint}>
          <Ionicons name="checkmark-circle" size={iconSizes.sm} color={colors.success} />
          <ThemedText variant="caption" style={{ color: colors.success }}>
            {copy.pasteRecognised}
          </ThemedText>
          <ThemedText variant="caption" style={[styles.recognised, { color: colors.textMuted }]}>
            {recognised.shortForm}
          </ThemedText>
        </View>
      ) : null}

      {vm.isEmpty ? (
        <View style={styles.hint}>
          <Ionicons name="warning-outline" size={iconSizes.xs} color={danger.icon} />
          <ThemedText variant="caption" style={[styles.fieldError, { color: danger.text }]}>
            {copy.pasteEmpty}
          </ThemedText>
        </View>
      ) : null}

      {vm.showManualHint && vm.failure === null && !vm.isEmpty ? (
        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={iconSizes.xs} color={colors.textMuted} />
          <ThemedText variant="caption" style={[styles.recognised, { color: colors.textMuted }]}>
            {copy.pasteManual}
          </ThemedText>
        </View>
      ) : null}

      {vm.failure !== null ? (
        <View style={styles.banner}>
          <FormBanner
            message={failureContent(vm.failure).body}
            severity={failureSeverity(vm.failure)}
            icon={failureIcon(vm.failure)}
            onDismiss={vm.onDismissFailure}
          />
        </View>
      ) : null}

      <ImportPasteSteps />

      <View style={styles.footer}>
        <PrimaryButton label={copy.pasteSubmit} onPress={handleSubmit} />
        <View style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={iconSizes.xs} color={colors.textMuted} />
          <ThemedText variant="caption" style={[styles.noteText, { color: colors.textMuted }]}>
            {copy.pasteNote}
          </ThemedText>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: ValueConstants.one,
    paddingHorizontal: spacing.lg2,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg2,
  },
  closeBtn: {
    width: controlSizes.pageCloseBtn,
    height: controlSizes.pageCloseBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginBottom: spacing.sm,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    marginTop: spacing.xs2,
    paddingLeft: spacing.xxs,
  },
  fieldError: {
    flexShrink: ValueConstants.one,
    fontWeight: fontWeights.medium,
  },
  banner: {
    marginTop: spacing.sm2,
  },
  noteText: {
    flexShrink: ValueConstants.one,
    textAlign: 'center',
  },
  recognised: {
    flexShrink: ValueConstants.one,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
    gap: spacing.sm2,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
  },
});
