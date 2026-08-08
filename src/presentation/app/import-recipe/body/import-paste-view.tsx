import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { failureContent, failureIcon, failureSeverity } from '@presentation/base/errors/failure-lookups';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  iconSizes,
  controlSizes,
  decorSizes,
  borderWidths,
  BrandColors,
} from '@presentation/base/theme';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { t } from '@presentation/i18n';
import { ImportPasteSteps } from '@presentation/app/import-recipe/body/import-paste-steps';
import { usePasteImportLink } from '@presentation/app/import-recipe/hooks/use-paste-import-link';
import { ValueConstants } from '@core/constants';

export interface ImportPasteViewProps {
  /** Hands back a validated Instagram URL to queue. */
  onSubmit: (url: string) => void;
  onCancel: () => void;
}

const GRADIENT_START = { x: ValueConstants.zero, y: ValueConstants.zero };
const GRADIENT_END = { x: ValueConstants.one, y: ValueConstants.one };
const GRADIENT_STOPS = [
  BrandColors.instagramGradientStart,
  BrandColors.instagramGradientMid,
  BrandColors.instagramGradientEnd,
] as const;

/**
 * Import by pasting a link — the entry that does not depend on the OS.
 *
 * @remarks
 * The share sheet only exists on Android today, and never on the web, so this
 * is the path that works everywhere: copy the link in Instagram, paste it here.
 * The three-step card is not decoration — "Copy link" is buried in Instagram's
 * ⋯ menu, and a user who cannot find it has no way to use the feature at all.
 */
export const ImportPasteView = ({ onSubmit, onCancel }: ImportPasteViewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().importRecipe;
  const vm = usePasteImportLink();
  const inputLineHeight = useTextLineHeight(fontSizes.body);

  const handleSubmit = (): void => {
    const url = vm.submit();
    if (url !== null) onSubmit(url);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
        <LinearGradient
          colors={[...GRADIENT_STOPS]}
          start={GRADIENT_START}
          end={GRADIENT_END}
          style={styles.leadBadge}
        >
          <Ionicons name="logo-instagram" size={iconSizes.xl} color={BrandColors.white} />
        </LinearGradient>
        <ThemedText variant="body" style={[styles.leadText, { color: colors.textMuted }]}>
          {copy.pasteLead}
        </ThemedText>
      </View>

      <ThemedText variant="caption" style={[styles.label, { color: colors.textMuted }]}>
        {copy.pasteLabel}
      </ThemedText>

      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.inputBackground,
            borderColor: vm.failure !== null ? colors.danger : colors.inputBorder,
          },
        ]}
      >
        <Ionicons name="link-outline" size={iconSizes.md} color={colors.textMuted} />
        {/* Auto-grow, not a single line: a pasted URL is longer than the field
            and scrolled its own identifying half out of sight, leaving the user
            staring at `https://www.instagram.com/p/` wondering what they had
            copied. It wraps now, and the whole link is readable at once. */}
        <AutoGrowTextInput
          value={vm.value}
          onChangeText={vm.onChangeValue}
          onBlur={vm.onBlur}
          onSubmitEditing={handleSubmit}
          placeholder={copy.pastePlaceholder}
          placeholderTextColor={colors.textMuted}
          inputMode="url"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          minHeight={controlSizes.input}
          accessibilityLabel={copy.pasteLabel}
          style={[styles.input, { color: colors.text, lineHeight: inputLineHeight }]}
        />
        <Pressable
          onPress={vm.onPaste}
          style={[styles.pasteBtn, { backgroundColor: colors.chipBackground }]}
          accessibilityRole="button"
          accessibilityLabel={copy.pasteAction}
        >
          <ThemedText variant="caption" style={[styles.pasteLabel, { color: colors.chipText }]}>
            {copy.pasteAction}
          </ThemedText>
        </Pressable>
      </View>

      {vm.recognised !== null && vm.failure === null ? (
        <View style={styles.hint}>
          <Ionicons name="checkmark-circle" size={iconSizes.sm} color={colors.success} />
          <ThemedText variant="caption" style={{ color: colors.success }}>
            {copy.pasteRecognised}
          </ThemedText>
          <ThemedText variant="caption" style={[styles.recognised, { color: colors.textMuted }]}>
            {vm.recognised}
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
  leadBadge: {
    width: decorSizes.badgeSm,
    height: decorSizes.badgeSm,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadText: {
    flex: ValueConstants.one,
  },
  label: {
    fontWeight: fontWeights.semibold,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    minHeight: controlSizes.input,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
  },
  input: {
    flex: ValueConstants.one,
    fontSize: fontSizes.body,
  },
  pasteBtn: {
    minHeight: controlSizes.chip,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  pasteLabel: {
    fontWeight: fontWeights.bold,
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
