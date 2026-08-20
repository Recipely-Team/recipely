import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { spacing, fontSizes, controlSizes, iconSizes, fontWeights } from '@presentation/base/theme';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { t } from '@presentation/i18n';
import type { TabBarKey } from '@presentation/base/widgets/navigation/tab-bar-key';
import type { TabItem } from '@presentation/base/widgets/navigation/tab-item';
import { CharConstants, ValueConstants } from '@core/constants';

export interface TabBarProps {
  active: TabBarKey;
  onChange: (key: TabBarKey) => void;
}

/**
 * Bottom navigation bar with icon-and-label tabs for the main app sections.
 * Returns null on the web shell breakpoint — the WebHeader replaces it there.
 */
export const TabBar = ({ active, onChange }: TabBarProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();
  const bottomPad = Math.max(insets.bottom, spacing.md);
  if (isWebShell) return null;

  const tabs: TabItem<TabBarKey>[] = [
    { key: 'recipes', label: t().navigation.recipes, icon: 'restaurant-outline' },
    { key: 'myRecipes', label: t().navigation.myRecipes, icon: 'bookmark-outline' },
    { key: 'profile', label: t().navigation.profile, icon: 'person-outline' },
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
        const filledIcon = (tab.icon.replace('-outline', CharConstants.empty) as keyof typeof Ionicons.glyphMap);
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
          >
            <Ionicons name={isActive ? filledIcon : tab.icon} size={iconSizes.xxl} color={tint} />
            <ThemedText
              variant="caption"
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    gap: spacing.xxs,
  },
  label: {
    fontSize: fontSizes.micro,
  },
});
