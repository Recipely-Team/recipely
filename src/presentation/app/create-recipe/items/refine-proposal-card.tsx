import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  lineHeightFor,
  iconSizes,
  borderWidths,
  layoutSizes,
  controlSizes,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { RecipeChangeKind } from '@presentation/app/create-recipe/model/refine/recipe-change-kind';
import { ValueConstants } from '@core/constants';

import type { RecipeChange } from '@presentation/app/create-recipe/model/refine/recipe-change';
import type { CreateRecipeFieldKey } from '@presentation/app/create-recipe/model/validation/create-recipe-field-key';

export interface RefineProposalCardProps {
  changes: readonly RecipeChange[];
  onAccept: () => void;
  onReject: () => void;
}

/**
 * The change the assistant proposes, and the two buttons that decide it.
 *
 * @remarks
 * - **Decline reads as the neutral action, not the destructive one.** Nothing
 *   has been applied yet, so declining costs the cook nothing — styling it as a
 *   danger would make the safe answer look like the risky one.
 * - **Taxonomy keys are resolved here, not in the diff.** `cuisine` and
 *   `category` arrive as catalog keys; the name lives behind a hook, and the
 *   diff stays a pure function by not reaching for it.
 * - **The list scrolls inside the card.** A refinement that rewrites every step
 *   would otherwise push the accept button off the bottom of the dock.
 */
export const RefineProposalCard = ({
  changes,
  onAccept,
  onReject,
}: RefineProposalCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { cuisineLabel, categoryLabel } = useTaxonomyLabel();

  const fieldLabel = (field: CreateRecipeFieldKey): string => t().createRecipe.changeFields[field];

  const valueLabel = (field: CreateRecipeFieldKey, value: string): string => {
    if (value.length === ValueConstants.zero) return t().createRecipe.changeEmptyValue;
    if (field === 'cuisine') return cuisineLabel(value)?.name ?? value;
    if (field === 'category') return categoryLabel(value)?.name ?? value;
    return value;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.chipBackground, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name="git-compare-outline" size={iconSizes.md} color={colors.primary} />
        <ThemedText style={[styles.title, { color: colors.text }]}>
          {t().createRecipe.proposalTitle}
        </ThemedText>
      </View>

      <ScrollView style={styles.changes} contentContainerStyle={styles.changesInner}>
        {changes.map((change) => (
          <View key={change.field} style={styles.change}>
            <ThemedText variant="caption" style={[styles.fieldName, { color: colors.textMuted }]}>
              {fieldLabel(change.field)}
            </ThemedText>
            {change.kind === RecipeChangeKind.Value ? (
              <ThemedText style={[styles.changeText, { color: colors.text }]}>
                {`${valueLabel(change.field, change.before)} → ${valueLabel(change.field, change.after)}`}
              </ThemedText>
            ) : (
              <View>
                {change.removed.map((line) => (
                  <ThemedText
                    key={`-${line}`}
                    style={[styles.changeText, styles.removedLine, { color: colors.danger }]}
                  >
                    {`− ${line}`}
                  </ThemedText>
                ))}
                {change.added.map((line) => (
                  <ThemedText key={`+${line}`} style={[styles.changeText, { color: colors.success }]}>
                    {`+ ${line}`}
                  </ThemedText>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          onPress={onReject}
          style={[styles.button, { borderColor: colors.border, borderWidth: borderWidths.hairline }]}
          accessibilityRole="button"
          accessibilityLabel={t().createRecipe.proposalReject}
        >
          <ThemedText style={[styles.buttonText, { color: colors.textMuted }]}>
            {t().createRecipe.proposalReject}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={onAccept}
          style={[styles.button, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={t().createRecipe.proposalAccept}
        >
          <ThemedText style={[styles.buttonText, { color: colors.primaryText }]}>
            {t().createRecipe.proposalAccept}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  changes: {
    maxHeight: layoutSizes.dropdownMaxHeight,
  },
  changesInner: {
    gap: spacing.sm,
  },
  change: {
    gap: spacing.xxs,
  },
  fieldName: {
    fontWeight: fontWeights.semibold,
  },
  changeText: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeightFor(fontSizes.caption),
  },
  removedLine: {
    textDecorationLine: 'line-through',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: ValueConstants.one,
    minHeight: controlSizes.chip,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  buttonText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
});
