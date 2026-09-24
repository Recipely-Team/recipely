import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { failureContent, failureIcon, failureSeverity } from '@presentation/base/errors/failure-lookups';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontWeights,
  iconSizes,
  controlSizes,
  borderWidths,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ImportPasteSteps } from '@presentation/app/import-recipe/body/import-paste-steps';
import { usePasteImportLink } from '@presentation/app/import-recipe/hooks/use-paste-import-link';
import { ValueConstants } from '@core/constants';
import { ProvenanceMark } from '@domain/recipes/provenance/provenance-mark';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { provenanceSealMetrics } from '@presentation/base/widgets/badges/provenance-seal-metrics';
import { ImportPasteField } from '@presentation/app/import-recipe/body/import-paste-field';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';

export interface ImportPasteViewProps {
  /** Hands back a validated Instagram or recipe-page URL to queue. */
  onSubmit: (url: string) => void;
  onCancel: () => void;
}

const ACCEPTED_MARKS = [ProvenanceMark.Instagram, ProvenanceMark.Web] as const;

/**
 * Import by pasting a link — the entry that does not depend on the OS.
 *
 * @remarks
 * - **The path that works everywhere.** The share sheet only exists on the
 *   phone, and never on the web: copy the link in Instagram or the browser,
 *   paste it here.
 * - **The three-step card is not decoration** — "Copy link" is buried in
 *   Instagram's ⋯ menu, and a user who cannot find it cannot use the feature.
 * - **A recognised link shows its platform's glyph in the field**, in the same
 *   white seal a recipe card wears, so the user sees WHICH link was understood.
 */
export const ImportPasteView = ({ onSubmit, onCancel }: ImportPasteViewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const scrollable = useAssistantScrollable();
  const copy = t().importRecipe;
  const vm = usePasteImportLink();
  const recognised = vm.failure === null ? vm.recognised : null;

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

      <View style={[styles.lead, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View>
          <ProvenanceSeal
            marks={ACCEPTED_MARKS}
            surface={SealSurface.Page}
            size={provenanceSealMetrics.importLeadSize}
            label={copy.pasteLabel}
          />
        </View>
        <ThemedText variant="body" style={[styles.leadText, { color: colors.textMuted }]}>
          {copy.pasteLead}
        </ThemedText>
      </View>

      <ThemedText variant="caption" style={[styles.label, { color: colors.textMuted }]}>
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
          <Ionicons name="alert-circle-outline" size={iconSizes.sm} color={colors.danger} />
          <ThemedText variant="caption" style={{ color: colors.danger }}>
            {copy.pasteEmpty}
          </ThemedText>
        </View>
      ) : null}

      {vm.showManualHint ? (
        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={iconSizes.sm} color={colors.textMuted} />
          <ThemedText variant="caption" style={{ color: colors.textMuted }}>
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
          />
        </View>
      ) : null}

      <ImportPasteSteps />

      <View style={styles.footer}>
        <PrimaryButton label={copy.pasteSubmit} onPress={handleSubmit} />
        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={iconSizes.sm} color={colors.textMuted} />
          <ThemedText variant="caption" style={[styles.note, { color: colors.textMuted }]}>
            {copy.pasteNote}
          </ThemedText>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  closeBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  leadText: {
    flex: ValueConstants.one,
  },
  label: {
    fontWeight: fontWeights.semibold,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  banner: {
    marginTop: spacing.xs,
  },
  note: {
    flex: ValueConstants.one,
  },
  recognised: {
    flexShrink: ValueConstants.one,
  },
  footer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
