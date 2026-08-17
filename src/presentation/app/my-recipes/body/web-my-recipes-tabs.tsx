import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, borderWidths } from '@presentation/base/theme';
import { TabIcons } from '@presentation/app/my-recipes/model/tab-icons';
import type { MyRecipesTab } from '@presentation/app/my-recipes/model/my-recipes-tab';
import type { TabType } from '@presentation/app/my-recipes/model/tab-type';

export interface WebMyRecipesTabsProps {
  tabs: readonly MyRecipesTab[];
  active: TabType;
  onChange: (key: TabType) => void;
}

/** Web My Recipes underlined tab row: each tab shows its icon and a count pill;
 * the active tab carries a primary underline. */
export const WebMyRecipesTabs = ({ tabs, active, onChange }: WebMyRecipesTabsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      {tabs.map(({ key, label, count }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
            style={[styles.tab, { borderBottomColor: isActive ? colors.primary : 'transparent' }]}
          >
            <MaterialCommunityIcons
              name={TabIcons[key]}
              size={iconSizes.md}
              color={isActive ? colors.text : colors.textMuted}
            />
            <ThemedText style={[styles.label, { color: isActive ? colors.text : colors.textMuted }]}>
              {label}
            </ThemedText>
            <View
              style={[
                styles.pill,
                { backgroundColor: isActive ? colors.primary : colors.chipBackground },
              ]}
            >
              <ThemedText
                variant="caption"
                style={[styles.pillText, { color: isActive ? colors.primaryText : colors.chipText }]}
              >
                {count}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: borderWidths.medium,
  },
  label: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.body,
  },
  pill: {
    minWidth: iconSizes.xl,
    paddingHorizontal: spacing.xs2,
    paddingVertical: spacing.xxs,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.micro,
  },
});
