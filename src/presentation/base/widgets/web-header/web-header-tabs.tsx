import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  borderWidths,
  opacities,
  iconSizes, fontWeights } from '@presentation/base/theme';
import type { WebHeaderTabKey } from '@presentation/base/widgets/web-header/web-header-tab-key';
import type { TabItem } from '@presentation/base/widgets/navigation/tab-item';
import { TabIcon } from '@presentation/base/widgets/navigation/tab-icon';

export interface WebHeaderTabsProps {
  active: WebHeaderTabKey | null;
  tabs: TabItem<WebHeaderTabKey>[];
  onPress: (key: WebHeaderTabKey) => void;
}

/** Horizontal nav with an animated primary-color underline beneath the active tab. */
export const WebHeaderTabs = ({ active, tabs, onPress }: WebHeaderTabsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const tint = isActive ? colors.text : colors.textMuted;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onPress(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            style={(state) => [
              styles.tab,
              (state as { hovered?: boolean }).hovered === true && styles.hovered,
            ]}
          >
            <TabIcon icon={tab.icon} active={false} size={iconSizes.md} color={tint} />
            <ThemedText
              style={[styles.label, { color: tint, fontWeight: isActive ? fontWeights.bold : fontWeights.medium }]}
            >
              {tab.label}
            </ThemedText>
            {isActive ? (
              <View style={[styles.underline, { backgroundColor: colors.primary }]} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: '100%',
    gap: spacing.xxs,
  },
  tab: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    height: '100%',
    borderRadius: radii.sm,
  },
  hovered: {
    opacity: opacities.pressedSubtle,
  },
  label: {
    fontSize: fontSizes.medium,
  },
  underline: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: -borderWidths.hairline,
    height: borderWidths.medium,
    borderTopLeftRadius: radii.xs,
    borderTopRightRadius: radii.xs,
  },
});
