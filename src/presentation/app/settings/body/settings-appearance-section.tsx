import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { SectionHeader } from '@presentation/base/widgets/text/section-header';
import { SettingsRow } from '@presentation/base/widgets/settings/settings-row';
import { ThemeToggle } from '@presentation/base/widgets/settings/theme-toggle';
import { ThemeGrid } from '@presentation/base/widgets/settings/theme-grid';
import { LanguageSelector } from '@presentation/base/widgets/settings/language-selector';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, iconSizes, controlSizes } from '@presentation/base/theme';
import { t, useLocale, setLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/** Light/dark mode, language and the colour palette: everything that changes how the app looks. */
export const SettingsAppearanceSection = (): React.JSX.Element => {
  const { themeId, preference, setThemeId, setPreference, colors } = useTheme();
  const language = useLocale();
  return (
    <>
      <SectionHeader title={t().settings.appearance} />
      <View style={[styles.group, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.stackedRow}>
          <View style={styles.stackedHeader}>
            <Ionicons name="contrast-outline" size={iconSizes.xl} color={colors.primary} />
            <ThemedText variant="body" style={styles.stackedLabel}>
              {t().settings.mode}
            </ThemedText>
          </View>
          <ThemeToggle value={preference} onChange={setPreference} />
        </View>
        <View style={[styles.rowSeparator, { backgroundColor: colors.border }]} />
        <SettingsRow
          icon="language-outline"
          label={t().settings.language}
          rightElement={<LanguageSelector value={language} onChange={setLocale} />}
        />
      </View>

      <SectionHeader title={t().settings.themePalette} />
      <ThemeGrid selectedThemeId={themeId} onSelect={setThemeId} />
    </>
  );
};

const styles = StyleSheet.create({
  group: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
  },
  stackedRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  stackedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stackedLabel: {
    flex: ValueConstants.one,
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: controlSizes.searchBar + spacing.sm2,
  },
});
