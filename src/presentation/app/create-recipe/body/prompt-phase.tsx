import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, fontWeights, lineHeightFor, iconSizes, controlSizes, avatarSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ResumeDraftCard } from '@presentation/app/create-recipe/items/resume-draft-card';
import { FieldErrorText } from '@presentation/app/create-recipe/items/field-error-text';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { ValueConstants } from '@core/constants';

export interface PromptPhaseProps {
  insets: EdgeInsets;
  prompt: string;
  generateError: string | null;
  onChangePrompt: (value: string) => void;
  onAppendChip: (chip: string) => void;
  onGenerate: () => void;
  onStartBlank: () => void;
  onClose: () => void;
  latestDraft: RecipeDraft | null;
  onResumeDraft: () => void;
}

/** Phase 1 of the unified flow: the gradient hero + AI prompt entry. */
export const PromptPhase = ({
  insets,
  prompt,
  generateError,
  onChangePrompt,
  onAppendChip,
  onGenerate,
  onStartBlank,
  onClose,
  latestDraft,
  onResumeDraft,
}: PromptPhaseProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const canGenerate = prompt.trim().length > ValueConstants.zero;
  const ideaChips = t().createRecipe.ideaChips;
  const draftName = latestDraft?.snapshot.name?.trim();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={onClose}
          hitSlop={spacing.sm}
          style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          accessibilityRole="button"
          accessibilityLabel={t().createRecipe.cancel}
        >
          <Ionicons name="close" size={iconSizes.lg} color={colors.text} />
        </Pressable>
        <ThemedText variant="subtitle" style={styles.headerTitle}>
          {t().createRecipe.promptTitle}
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
          start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
          end={{ x: ValueConstants.one, y: ValueConstants.one }}
          style={[styles.hero, shadows.md]}
        >
          <Ionicons name="sparkles" size={iconSizes.illustration} color={colors.onOverlay} style={styles.heroBgIcon} />
          <View style={[styles.heroBadge, { backgroundColor: colors.gradientSurface, borderColor: colors.gradientBorder }]}>
            <Ionicons name="restaurant" size={iconSizes.xxl} color={colors.onOverlay} />
          </View>
          <ThemedText variant="title" style={[styles.heroTitle, { color: colors.onOverlay }]}>
            {t().createRecipe.promptHeadline}
          </ThemedText>
          <ThemedText variant="body" style={[styles.heroSub, { color: colors.onOverlay }]}>
            {t().createRecipe.promptSub}
          </ThemedText>
        </LinearGradient>

        {latestDraft !== null ? (
          <ResumeDraftCard draftName={draftName} onPress={onResumeDraft} />
        ) : null}

        <View
          style={[
            styles.promptCard,
            {
              backgroundColor: colors.surface,
              borderColor: generateError !== null ? colors.danger : colors.inputBorder,
            },
            shadows.sm,
          ]}
        >
          <AutoGrowTextInput
            value={prompt}
            onChangeText={onChangePrompt}
            placeholder={t().createRecipe.promptPlaceholder}
            placeholderTextColor={colors.textMuted}
            minHeight={controlSizes.promptInput}
            style={[styles.promptInput, { color: colors.text }]}
          />
          {generateError !== null ? <FieldErrorText message={generateError} /> : null}
          <View style={styles.chipRow}>
            {ideaChips.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => onAppendChip(chip)}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.background }]}
                accessibilityRole="button"
                accessibilityLabel={chip}
              >
                <ThemedText variant="caption" style={[styles.chipLabel, { color: colors.text }]}>
                  {chip}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={onGenerate}
          disabled={!canGenerate}
          style={[styles.cta, shadows.md, { opacity: canGenerate ? opacities.full : opacities.disabled }]}
          accessibilityRole="button"
          accessibilityLabel={t().createRecipe.generate}
        >
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
            end={{ x: ValueConstants.one, y: ValueConstants.one }}
            style={styles.ctaInner}
          >
            <Ionicons name="sparkles" size={iconSizes.md} color={colors.primaryText} />
            <ThemedText variant="body" style={[styles.ctaLabel, { color: colors.primaryText }]}>
              {t().createRecipe.generate}
            </ThemedText>
          </LinearGradient>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <ThemedText variant="caption" style={{ color: colors.textMuted }}>
            {t().createRecipe.or}
          </ThemedText>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <Pressable
          onPress={onStartBlank}
          style={[styles.blankBtn, { borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={t().createRecipe.startBlank}
        >
          <ThemedText variant="body" style={[styles.blankLabel, { color: colors.text }]}>
            {t().createRecipe.startBlank}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: ValueConstants.one },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  iconBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    textAlign: 'center',
  },
  headerSpacer: {
    width: controlSizes.iconBtn,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    borderRadius: radii.xxl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  heroBgIcon: {
    position: 'absolute',
    right: -spacing.lg,
    top: -spacing.lg,
    opacity: opacities.scrim,
  },
  heroBadge: {
    width: avatarSizes.md,
    height: avatarSizes.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontWeight: fontWeights.heavy,
  },
  heroSub: {
    marginTop: spacing.xs,
    lineHeight: lineHeightFor(fontSizes.body),
  },
  promptCard: {
    borderRadius: radii.xl,
    borderWidth: borderWidths.thin,
    padding: spacing.md,
  },
  promptInput: {
    fontSize: fontSizes.body,
    lineHeight: lineHeightFor(fontSizes.body),
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs2,
    marginTop: spacing.sm,
  },
  chip: {
    minHeight: controlSizes.chip,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.medium,
  },
  cta: {
    minHeight: controlSizes.button,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  ctaInner: {
    flex: ValueConstants.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ctaLabel: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.heading,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dividerLine: {
    flex: ValueConstants.one,
    height: StyleSheet.hairlineWidth,
  },
  blankBtn: {
    minHeight: controlSizes.buttonSm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blankLabel: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.medium,
  },
});
