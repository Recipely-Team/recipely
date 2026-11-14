import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ALL_LOCALE_LIST } from '@application/i18n/supported-locales';
import { LANGUAGE_NAMES } from '@presentation/base/widgets/settings/language-names';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, controlSizes } from '@presentation/base/theme';

/** How many rows the open list shows before it scrolls. */
const DEV_LIST_ROWS = 8;

export interface DevLocalePickerProps {
  value: string;
  onChange: (locale: string) => void;
}

/**
 * A dev-only combo box that previews a screen in another language.
 *
 * @remarks
 * - **Every language is selectable here, preview ones included.** This is a
 *   layout check, not a shipping choice, so the "coming soon" rule of the real
 *   picker does not apply.
 * - **Rendered only in development builds** by its caller, so release builds
 *   never show it.
 * - **Inline list, not a sheet.** A sheet would cover the layout being checked.
 */
export const DevLocalePicker = ({ value, onChange }: DevLocalePickerProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const [isOpen, setOpen] = useState(false);

  const select = (locale: string): void => {
    onChange(locale);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setOpen(!isOpen)}
        style={[styles.trigger, { backgroundColor: colors.inputBackground }]}
        accessibilityRole="button"
        accessibilityLabel={LANGUAGE_NAMES[value] ?? value}
      >
        <ThemedText variant="caption" style={styles.label}>
          {LANGUAGE_NAMES[value] ?? value}
        </ThemedText>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={iconSizes.sm} color={colors.textMuted} />
      </Pressable>
      {isOpen ? (
        <ScrollView style={[styles.list, { backgroundColor: colors.inputBackground }]} nestedScrollEnabled>
          {ALL_LOCALE_LIST.map((locale) => (
            <Pressable
              key={locale}
              onPress={() => select(locale)}
              style={styles.option}
              accessibilityRole="button"
              accessibilityState={{ selected: locale === value }}
              accessibilityLabel={LANGUAGE_NAMES[locale] ?? locale}
            >
              <ThemedText variant="body" style={locale === value ? styles.selected : undefined}>
                {LANGUAGE_NAMES[locale] ?? locale}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, zIndex: 1 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    minHeight: controlSizes.selector,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
  },
  label: { fontWeight: fontWeights.semibold },
  list: { maxHeight: controlSizes.selector * DEV_LIST_ROWS, borderRadius: radii.lg, marginTop: spacing.xs },
  option: { minHeight: controlSizes.settingsRow, justifyContent: 'center', paddingHorizontal: spacing.md },
  selected: { fontWeight: fontWeights.bold },
});
