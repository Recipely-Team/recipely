import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { TabIcons } from '@presentation/app/my-recipes/model/tab-icons';
import type { MyRecipesTab } from '@presentation/app/my-recipes/model/my-recipes-tab';
import type { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  letterSpacings,
  iconSizes,
  borderWidths,
} from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface MyRecipesTabsProps {
  tabs: readonly MyRecipesTab[];
  active: TabType;
  onChange: (key: TabType) => void;
}

/**
 * Mobile My-Recipes tab row: Saved / Liked / Created / Drafts.
 *
 * @remarks
 * - **Four equal columns, not a pill** — the segmented pill this replaced sized
 *   each segment to its label, and a fourth tab pushed the Turkish labels
 *   ("Beğendiklerim", "Oluşturduklarım") past the width of a 390pt screen. A
 *   column is `flexBasis: 0`, so the row splits by count rather than by text.
 * - **Icon and count ride above the label** so the label gets the full column
 *   width for its one line, and the underline reads as the same control the web
 *   tab row is.
 */
export const MyRecipesTabs = ({ tabs, active, onChange }: MyRecipesTabsProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.row, { borderBottomColor: colors.cardBorder }]}>
      {tabs.map(({ key, label, count }) => {
        const isActive = active === key;
        const tint = isActive ? colors.primary : colors.textMuted;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
            style={styles.tab}
          >
            <View style={styles.badgeRow}>
              <MaterialCommunityIcons name={TabIcons[key]} size={iconSizes.sm} color={tint} />
              <View
                style={[
                  styles.countPill,
                  { backgroundColor: isActive ? colors.chipBackground : colors.surface },
                ]}
              >
                <ThemedText
                  variant="caption"
                  style={[styles.countText, { color: isActive ? colors.chipText : colors.textMuted }]}
                >
                  {count}
                </ThemedText>
              </View>
            </View>
            <ThemedText
              variant="caption"
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: isActive ? colors.text : colors.textMuted,
                  fontWeight: isActive ? fontWeights.bold : fontWeights.medium,
                },
              ]}
            >
              {label}
            </ThemedText>
            {isActive && <View style={[styles.underline, { backgroundColor: colors.primary }]} />}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: borderWidths.hairline,
  },
  tab: {
    flexGrow: ValueConstants.one,
    flexShrink: ValueConstants.one,
    flexBasis: ValueConstants.zero,
    minWidth: ValueConstants.zero,
    alignItems: 'center',
    gap: spacing.xxs,
    paddingTop: spacing.xxs,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xxs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countPill: {
    minWidth: iconSizes.lg,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.micro,
  },
  label: {
    fontSize: fontSizes.micro,
    letterSpacing: letterSpacings.tight,
    textAlign: 'center',
  },
  // Sits on the container's own hairline, so the active column looks like it
  // owns that stretch of the rule rather than drawing a second one under it.
  underline: {
    position: 'absolute',
    left: spacing.xs,
    right: spacing.xs,
    bottom: -borderWidths.hairline,
    height: borderWidths.medium,
    borderRadius: radii.round,
  },
});
