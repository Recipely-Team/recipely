import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { CountBadge } from '@presentation/base/widgets/text/count-badge';
import { CountBadgeTone } from '@presentation/base/widgets/text/count-badge-tone';
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
 * - **The count rides ON the icon** — as a badge rather than a pill beside it.
 *   Four labels, four glyphs and four separate count pills was more than a
 *   phone-width row could seat legibly; hanging the number off its own glyph
 *   gives the label the whole column back.
 * - **A tally, not an alert.** The badge is drawn in the chip palette, not the
 *   danger red the notification bell wears. Shipped red first, and four
 *   scarlet discs over four tabs read as four problems when the user had
 *   simply saved six recipes — and "9+" hid the draft count they came to see.
 * - **The badge clears the glyph** — it hangs off the top-right corner rather
 *   than sitting on it. Overlapping cost more than it saved: at two digits the
 *   count covered the icon it was counting, which is the one thing the column
 *   uses to say which tab it is.
 * - **A tab with nothing in it wears no badge** — `CountBadge` renders nothing
 *   at zero, so an empty Drafts tab is quiet instead of showing a "0".
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
            // The badge caps at "9+", so the true count is spelled out here.
            accessibilityLabel={`${label}, ${count}`}
            style={styles.tab}
          >
            <View style={styles.glyph}>
              <MaterialCommunityIcons name={TabIcons[key]} size={iconSizes.lg} color={tint} />
              <CountBadge count={count} tone={CountBadgeTone.Tally} style={styles.badge} />
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
    gap: spacing.xs,
    // Room for the badge, which now sits fully above the glyph's top edge.
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xxs,
  },
  // Sized to the glyph so the badge has a corner to hang off; `overflow` is
  // left visible (the default) on purpose — the badge is meant to escape it.
  glyph: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Anchored to the glyph's top-right CORNER — `bottom`/`left` at 100% put the
  // badge's bottom-left there, so it grows up and to the right, away from the
  // icon. Anchoring by `right` instead is what buried the icon: a two-digit
  // count widens leftward, and "12" sat straight on top of the heart. The
  // negative margins tuck it back a touch so it reads as attached.
  badge: {
    bottom: '100%',
    left: '100%',
    marginBottom: -spacing.xs,
    marginLeft: -spacing.xs,
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
