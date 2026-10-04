import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { spacing, fontSizes, controlSizes, iconSizes, fontWeights } from '@presentation/base/theme';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { t } from '@presentation/i18n';
import type { TabBarKey } from '@presentation/base/widgets/navigation/tab-bar-key';
import type { TabItem } from '@presentation/base/widgets/navigation/tab-item';
import { ValueConstants } from '@core/constants';
import { TabIcon } from '@presentation/base/widgets/navigation/tab-icon';
import { TabIconFamily } from '@presentation/base/widgets/navigation/tab-icon-family';

export interface TabBarProps {
  active: TabBarKey;
  onChange: (key: TabBarKey) => void;
}

/**
 * Bottom navigation bar with icon-and-label tabs for the five main sections —
 * Recipes, My Recipes, Chefs, Diary, Profile (design spec → Chefs tab §5).
 * Each tab shares the width equally and its label stays on one line with an
 * ellipsis. Returns null on the web shell — the WebHeader replaces it there.
 */
export const TabBar = ({ active, onChange }: TabBarProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();
  const bottomPad = Math.max(insets.bottom, spacing.md);
  if (isWebShell) return null;

  const tabs: TabItem<TabBarKey>[] = [
    { key: 'recipes', label: t().navigation.recipes, icon: { family: TabIconFamily.Ionicons, name: 'restaurant-outline' } },
    { key: 'myRecipes', label: t().navigation.myRecipes, icon: { family: TabIconFamily.Ionicons, name: 'bookmark-outline' } },
    { key: 'chefs', label: t().navigation.chefs, icon: { family: TabIconFamily.Material, name: 'chef-hat' } },
    { key: 'diary', label: t().navigation.diary, icon: { family: TabIconFamily.Ionicons, name: 'calendar-outline' } },
    { key: 'profile', label: t().navigation.profile, icon: { family: TabIconFamily.Ionicons, name: 'person-outline' } },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: bottomPad,
          height: controlSizes.tabBar + bottomPad,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const tint = isActive ? colors.tabBarActive : colors.tabBarInactive;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
          >
            <TabIcon icon={tab.icon} active={isActive} size={iconSizes.xxl} color={tint} />
            <ThemedText
              variant="caption"
              numberOfLines={ValueConstants.one}
              style={[
                styles.label,
                {
                  color: tint,
                  fontWeight: isActive ? fontWeights.bold : fontWeights.medium,
                },
              ]}
            >
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: ValueConstants.one,
    flexBasis: ValueConstants.zero,
    minWidth: ValueConstants.zero,
    paddingHorizontal: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    gap: spacing.xxs,
  },
  label: {
    fontSize: fontSizes.tiny,
    maxWidth: '100%',
  },
});
