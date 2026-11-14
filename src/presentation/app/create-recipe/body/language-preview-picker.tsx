import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Pressable } from '@presentation/base/widgets/buttons/pressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ALL_LOCALE_LIST } from '@application/i18n/supported-locales';
import { LANGUAGE_NAMES } from '@presentation/base/widgets/settings/language-names';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, controlSizes, borderWidths } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';

/** How many rows the open list shows before it scrolls. */
const LIST_ROWS = 8;

export interface LanguagePreviewPickerProps {
  value: string;
  onChange: (locale: string) => void;
}

/**
 * The language combo box on the edit screen: shows the screen in another language.
 *
 * @remarks
 * - **Built to the Premium board spec** (`specs/Premium Paywall RN implementation
 *   spec.md` §3): "Language" label, the active language's own name and a chevron;
 *   the open list shows every language with its code and checks the selected one.
 * - **It changes the edit screen only.** The app's saved language stays where the
 *   user set it, and the layout direction never flips.
 * - **Inline list, not a sheet**, so it never covers the screen it is changing.
 */
export const LanguagePreviewPicker = ({ value, onChange }: LanguagePreviewPickerProps): React.JSX.Element => {
  const t = useTranslations();
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
        style={[
          styles.field,
          { backgroundColor: colors.inputBackground, borderColor: isOpen ? colors.inputBorderFocused : colors.inputBorder },
        ]}
        accessibilityRole="combobox"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${t.settings.language}: ${LANGUAGE_NAMES[value] ?? value}`}
      >
        <ThemedText variant="caption" style={[styles.label, { color: colors.textSubtle }]}>
          {t.settings.language}
        </ThemedText>
        <ThemedText variant="body" style={styles.value}>
          {LANGUAGE_NAMES[value] ?? value}
        </ThemedText>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={iconSizes.lg} color={colors.textSubtle} />
      </Pressable>
      {isOpen ? (
        <ScrollView
          style={[styles.list, { backgroundColor: colors.background, borderColor: colors.border }]}
          nestedScrollEnabled
        >
          {ALL_LOCALE_LIST.map((locale) => {
            const isSelected = locale === value;
            return (
              <Pressable
                key={locale}
                onPress={() => select(locale)}
                style={[styles.option, isSelected ? { backgroundColor: colors.chipBackground } : null]}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={LANGUAGE_NAMES[locale] ?? locale}
              >
                <ThemedText variant="body" style={[styles.optionName, isSelected ? styles.selected : null]}>
                  {LANGUAGE_NAMES[locale] ?? locale}
                </ThemedText>
                <ThemedText variant="caption" style={{ color: colors.textSubtle }}>
                  {locale}
                </ThemedText>
                {isSelected ? <Ionicons name="checkmark" size={iconSizes.md} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, zIndex: 1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.selector,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  label: { flex: 1 },
  value: { fontWeight: fontWeights.semibold },
  list: {
    maxHeight: controlSizes.selector * LIST_ROWS,
    marginTop: spacing.xs,
    padding: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.settingsRow,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  optionName: { flex: 1 },
  selected: { fontWeight: fontWeights.bold },
});
