import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, controlSizes } from '@presentation/base/theme';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import type { ThemePreference } from '@presentation/base/theme/context/theme-preference';

export interface ThemeToggleProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

const options: { key: ThemePreference; labelKey: 'themeSystem' | 'themeLight' | 'themeDark' }[] = [
  { key: 'system', labelKey: 'themeSystem' },
  { key: 'light', labelKey: 'themeLight' },
  { key: 'dark', labelKey: 'themeDark' },
];

/** Three-segment toggle for selecting system, light, or dark colour scheme. */
export const ThemeToggle = ({ value, onChange }: ThemeToggleProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.inputBackground }]}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.segment,
              active ? { backgroundColor: colors.primary } : undefined,
            ]}
          >
            <ThemedText
              variant="caption"
              numberOfLines={1}
              style={[
                styles.segmentLabel,
                { color: active ? colors.primaryText : colors.textMuted },
              ]}
            >
              {t().settings[opt.labelKey]}
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
    borderRadius: radii.round,
    minHeight: controlSizes.selector,
    padding: spacing.xxs,
    overflow: 'hidden',
    gap: spacing.xxs,
  },
  segment: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.round,
    paddingHorizontal: spacing.xs,
    overflow: 'hidden',
  },
  segmentLabel: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.small,
  },
});
