import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, fontSizes, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface PlanShopBarProps {
  /** Web: a footer row under the grid with the week's summary; phone: a bar fixed under the scroll. */
  wide: boolean;
  summary: string | null;
  onPress: () => void;
}

/**
 * "Add week to shopping list" (design spec → Meal planner, Shopping CTA).
 * On a phone it sits under the scrolling plan, above the tab bar, with a
 * `cardBorder` top rule; on the web it closes the grid, with the week's
 * summary beside it.
 */
export const PlanShopBar = ({ wide, summary, onPress }: PlanShopBarProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const label = t().mealPlan.shopCta;
  if (wide) {
    return (
      <View style={styles.footer}>
        <SizedText size={fontSizes.caption} color={colors.textMuted} style={styles.grow}>
          {summary}
        </SizedText>
        <View>
          <PrimaryButton label={label} onPress={onPress} />
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.bar, { backgroundColor: colors.background, borderTopColor: colors.cardBorder }]}>
      <PrimaryButton label={label} onPress={onPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: ValueConstants.one },
  bar: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderTopWidth: borderWidths.hairline,
  },
});
