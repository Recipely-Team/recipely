import { useState } from 'react';
import { StyleSheet, View, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ScreenContainer } from '@presentation/base/widgets/layout/screen-container';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { SectionHeader } from '@presentation/base/widgets/text/section-header';
import { SettingsRow } from '@presentation/base/widgets/settings/settings-row';
import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';
import { failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { RoutePaths } from '@presentation/base/constants';
import { ThemeToggle } from '@presentation/base/widgets/settings/theme-toggle';
import { ThemeGrid } from '@presentation/base/widgets/settings/theme-grid';
import { LanguageSelector } from '@presentation/base/widgets/settings/language-selector';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes } from '@presentation/base/theme';
import { t, useLocale, setLocale } from '@presentation/i18n';
import { appVersion } from '@presentation/base/utils/app-version';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@infrastructure/constants/api';
import { CharConstants, ValueConstants } from '@core/constants';

export const SettingsScreen = (): React.JSX.Element => {
  const router = useRouter();
  const { themeId, preference, setThemeId, setPreference, colors } = useTheme();
  const { authStore } = useStores();
  const authState = authStore((s) => s.state);
  const signOut = authStore((s) => s.signOut);
  const deleteAccount = authStore((s) => s.deleteAccount);

  const language = useLocale() as 'en' | 'tr';

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

  const handleSignOut = async () => {
    await signOut();
    router.replace(RoutePaths.login);
  };

  const handleDeleteAccount = async (): Promise<void> => {
    setDeleteError(undefined);
    setDeleting(true);
    const failure = await deleteAccount();
    setDeleting(false);
    if (failure === null) {
      setDeleteVisible(false);
      router.replace(RoutePaths.login);
      return;
    }
    // WHY: the session stays intact on failure, so keep the sheet open and show
    // the error inline rather than navigating away.
    setDeleteError(failureToastMessage(failure));
  };

  const displayName =
    authState.status === 'authenticated' ? authState.session.user.displayName : CharConstants.empty;
  const email =
    authState.status === 'authenticated' ? authState.session.user.email.value : CharConstants.empty;
  const photoUrl =
    authState.status === 'authenticated' ? authState.session.user.photoUrl : undefined;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ResponsiveContainer route="settings" gutter={false} fill>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          accessibilityRole="button"
          accessibilityLabel={t().navigation.settings}
        >
          <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.text} />
        </Pressable>
        <ThemedText variant="subtitle" style={styles.headerTitle}>
          {t().settings.title}
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScreenContainer scrollable padded={false}>
        <View style={styles.profileSection}>
          <AvatarImage uri={photoUrl} name={displayName} size={80} />
          <ThemedText variant="title" style={styles.displayName}>
            {displayName}
          </ThemedText>
          <ThemedText variant="body" muted>
            {email}
          </ThemedText>
        </View>

        <SectionHeader title={t().settings.appearance} />
        <View style={[styles.group, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.stackedRow}>
            <View style={styles.stackedHeader}>
              <Ionicons name="contrast-outline" size={20} color={colors.primary} />
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
            rightElement={
              <LanguageSelector value={language} onChange={setLocale} />
            }
          />
        </View>

        <SectionHeader title={t().settings.themePalette} />
        <ThemeGrid selectedThemeId={themeId} onSelect={setThemeId} />

        <SectionHeader title={t().settings.account} />
        <View style={[styles.group, { backgroundColor: colors.cardBackground }]}>
          <SettingsRow
            icon="log-out-outline"
            label={t().settings.signOut}
            destructive
            onPress={() => void handleSignOut()}
          />
          <View style={[styles.rowSeparator, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="trash-outline"
            label={t().settings.deleteAccount}
            destructive
            onPress={() => {
              setDeleteError(undefined);
              setDeleteVisible(true);
            }}
          />
        </View>

        <SectionHeader title={t().settings.about} />
        <View style={[styles.group, { backgroundColor: colors.cardBackground }]}>
          <SettingsRow
            icon="information-circle-outline"
            label={t().settings.version}
            rightElement={
              <ThemedText variant="body" muted>
                {appVersion}
              </ThemedText>
            }
            showChevron={false}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label={t().settings.privacyPolicy}
            onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
          />
          <SettingsRow
            icon="document-text-outline"
            label={t().settings.termsOfUse}
            onPress={() => void Linking.openURL(TERMS_OF_USE_URL)}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScreenContainer>
      </ResponsiveContainer>
      <ConfirmSheet
        visible={deleteVisible}
        title={t().settings.deleteAccountConfirmTitle}
        message={t().settings.deleteAccountConfirmMessage}
        confirmLabel={t().settings.deleteAccount}
        destructive
        loading={deleting}
        error={deleteError}
        onConfirm={() => void handleDeleteAccount()}
        onClose={() => setDeleteVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: ValueConstants.one,
    textAlign: 'center',
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.heading,
  },
  headerSpacer: {
    width: controlSizes.iconBtn,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  displayName: {
    marginTop: spacing.md,
  },
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
  bottomSpacer: {
    height: spacing.xxl,
  },
});

export default SettingsScreen;
