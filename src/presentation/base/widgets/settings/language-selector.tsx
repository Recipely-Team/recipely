import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { radii, fontWeights, controlSizes } from '@presentation/base/theme';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ValueConstants } from '@core/constants';

export interface LanguageSelectorProps {
  value: 'en' | 'tr';
  onChange: (value: 'en' | 'tr') => void;
}

const options: { key: 'en' | 'tr'; label: string }[] = [
  { key: 'en', label: 'EN' },
  { key: 'tr', label: 'TR' },
];

/** Segmented EN / TR language picker that highlights the active locale. */
export const LanguageSelector = ({ value, onChange }: LanguageSelectorProps): React.JSX.Element => {
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
              style={{ color: active ? colors.primaryText : colors.textMuted, fontWeight: fontWeights.semibold }}
            >
              {opt.label}
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
    width: controlSizes.languageSelectorWidth,
    overflow: 'hidden',
  },
  segment: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.round,
  },
});
