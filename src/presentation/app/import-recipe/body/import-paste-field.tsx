import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ImportLink } from '@domain/recipes/import/import-link';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { provenanceSealMetrics } from '@presentation/base/widgets/badges/provenance-seal-metrics';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  iconSizes,
  controlSizes,
  borderWidths,
} from '@presentation/base/theme';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { recognisedLinkLabel } from '@presentation/app/import-recipe/model/recognised-link-label';

export interface ImportPasteFieldProps {
  value: string;
  onChangeValue: (next: string) => void;
  onBlur: () => void;
  onSubmit: () => void;
  onPaste: () => void;
  /** The link once understood; its platform's glyph replaces the link icon. */
  recognised: ImportLink | null;
  hasFailure: boolean;
}

/**
 * The paste field: the link, the clipboard button, and — once the link is
 * understood — its platform's glyph in the white seal a recipe card wears.
 *
 * @remarks
 * - **Auto-grow, not a single line.** A pasted URL is longer than the field
 *   and scrolled its own identifying half out of sight, leaving the user
 *   staring at `https://www.instagram.com/p/` wondering what they had copied.
 */
export const ImportPasteField = ({
  value,
  onChangeValue,
  onBlur,
  onSubmit,
  onPaste,
  recognised,
  hasFailure,
}: ImportPasteFieldProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().importRecipe;
  const inputLineHeight = useTextLineHeight(fontSizes.body);

  return (
    <View
      style={[
        styles.field,
        {
          backgroundColor: colors.inputBackground,
          borderColor: hasFailure ? colors.danger : colors.inputBorder,
        },
      ]}
    >
      <View style={styles.mark}>
        {recognised !== null ? (
          <ProvenanceSeal
            marks={[recognised.platform]}
            surface={SealSurface.Page}
            size={provenanceSealMetrics.importFieldSize}
            label={recognisedLinkLabel(recognised, copy)}
          />
        ) : (
          <Ionicons name="link-outline" size={iconSizes.md} color={colors.textMuted} />
        )}
      </View>
      <AutoGrowTextInput
        value={value}
        onChangeText={onChangeValue}
        onBlur={onBlur}
        onSubmitEditing={onSubmit}
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
        onPress={onPaste}
        style={[styles.pasteBtn, { backgroundColor: colors.chipBackground }]}
        accessibilityRole="button"
        accessibilityLabel={copy.pasteAction}
      >
        <ThemedText variant="caption" style={[styles.pasteLabel, { color: colors.chipText }]}>
          {copy.pasteAction}
        </ThemedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
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
  mark: {
    minHeight: controlSizes.input,
    justifyContent: 'center',
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
});
