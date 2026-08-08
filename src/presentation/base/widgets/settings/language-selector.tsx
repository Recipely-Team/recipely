import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORTED_LOCALE_LIST } from '@application/i18n/supported-locales';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { LANGUAGE_NAMES } from '@presentation/base/widgets/settings/language-names';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, controlSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Opens the language list and reports the choice.
 *
 * @remarks
 * A sheet, not the segmented EN/TR control this replaces: two languages fit in
 * a pill and ten do not, and squeezing them in would have produced a row of
 * unreadable two-letter codes. The trigger shows the ACTIVE language in its own
 * name, so the setting reads correctly whatever the app is currently in.
 */
export const LanguageSelector = ({ value, onChange }: LanguageSelectorProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const [open, setOpen] = useState(false);

  const select = (locale: string): void => {
    onChange(locale);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { backgroundColor: colors.inputBackground }]}
        accessibilityRole="button"
        accessibilityLabel={t().settings.language}
      >
        <ThemedText variant="caption" style={styles.triggerLabel}>
          {LANGUAGE_NAMES[value] ?? value}
        </ThemedText>
        <Ionicons name="chevron-down" size={iconSizes.sm} color={colors.textMuted} />
      </Pressable>

      <BottomSheet visible={open} title={t().settings.language} onClose={() => setOpen(false)}>
        <ScrollView contentContainerStyle={styles.list}>
          {SUPPORTED_LOCALE_LIST.map((locale) => {
            const active = locale === value;
            return (
              <Pressable
                key={locale}
                onPress={() => select(locale)}
                style={[styles.row, active ? { backgroundColor: colors.chipBackground } : null]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={LANGUAGE_NAMES[locale] ?? locale}
              >
                <ThemedText variant="body" style={active ? styles.activeLabel : undefined}>
                  {LANGUAGE_NAMES[locale] ?? locale}
                </ThemedText>
                {active ? (
                  <Ionicons name="checkmark" size={iconSizes.lg} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.selector,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
  },
  triggerLabel: {
    fontWeight: fontWeights.semibold,
  },
  list: {
    paddingBottom: spacing.md,
    gap: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: controlSizes.settingsRow,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
  },
  activeLabel: {
    fontWeight: fontWeights.bold,
  },
});
