import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { diarySizes, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import type { SegmentOption } from '@presentation/base/widgets/diary/segment-option';
import { ValueConstants } from '@core/constants';

export interface SegmentedTabsProps<K extends string> {
  options: readonly SegmentOption<K>[];
  value: K;
  onChange: (key: K) => void;
}

/**
 * A row of equal segments on a `surface` track; the selected one is filled
 * `primary`. Each segment is a `tab` with its selected state, so a screen
 * reader announces "Lunch, tab, selected" (design spec → Food Diary §9).
 */
export const SegmentedTabs = <K extends string>({ options, value, onChange }: SegmentedTabsProps<K>): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View accessibilityRole="tablist" style={[styles.track, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected ? { backgroundColor: colors.primary } : null]}
          >
            <SizedText
              size={fontSizes.caption}
              weight={fontWeights.bold}
              color={selected ? colors.primaryText : colors.textMuted}
              numberOfLines={ValueConstants.one}
            >
              {option.label}
            </SizedText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  segment: {
    flex: ValueConstants.one,
    minHeight: diarySizes.segmentHeight - spacing.xs,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
});
