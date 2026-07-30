import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface MyRecipesTabsProps {
  tabs: readonly { key: TabType; label: string; count: number }[];
  active: TabType;
  onChange: (key: TabType) => void;
}

/** Mobile segmented control for the Saved / Created / Drafts tabs. */
export const MyRecipesTabs = ({ tabs, active, onChange }: MyRecipesTabsProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.segmented, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      {tabs.map(({ key, label, count }) => {
        const isActive = active === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={[styles.segment, { backgroundColor: isActive ? colors.primary : 'transparent' }]}
          >
            <ThemedText
              variant="caption"
              numberOfLines={1}
              style={[styles.segmentLabel, { color: isActive ? colors.primaryText : colors.text }]}
            >
              {label}
            </ThemedText>
            <View
              style={[
                styles.countPill,
                { backgroundColor: isActive ? colors.gradientBorder : colors.chipBackground },
              ]}
            >
              <ThemedText
                variant="caption"
                style={[styles.countText, { color: isActive ? colors.primaryText : colors.chipText }]}
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
  segmented: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  segment: {
    flexGrow: ValueConstants.one,
    flexShrink: ValueConstants.one,
    flexBasis: 'auto',
    minWidth: ValueConstants.zero,
    height: controlSizes.iconBtn,
    paddingHorizontal: spacing.xs2,
    borderRadius: radii.round,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  segmentLabel: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.small,
    flexShrink: ValueConstants.one,
    minWidth: ValueConstants.zero,
  },
  countPill: {
    minWidth: iconSizes.xl,
    height: iconSizes.lg,
    paddingHorizontal: spacing.xs2,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: ValueConstants.zero,
  },
  countText: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.micro,
  },
});
