import { Pressable, StyleSheet, View } from 'react-native';
import type { VersionVerdict } from '@domain/app-version/version-verdict';
import { CharConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { brandMarkSizes, controlSizes, fontWeights, spacing } from '@presentation/base/theme';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { AppMark } from '@presentation/base/widgets/app-update/app-mark';
import { openStore } from '@presentation/base/utils/open-store';
import { useTranslations } from '@presentation/i18n';

export interface UpdateAvailableSheetProps {
  verdict: VersionVerdict;
  /** "Not now", the backdrop or a drag: remembered for this release only. */
  onDismiss: () => void;
}

/**
 * The optional-update prompt: the app stays usable underneath.
 *
 * @remarks
 * - **Update does not close it.** The store opens on top; coming back, the
 *   foreground check finds the new version and the sheet goes on its own. Only
 *   a dismissal is remembered — opening the store is not a "no".
 */
export const UpdateAvailableSheet = ({ verdict, onDismiss }: UpdateAvailableSheetProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  return (
    <BottomSheet visible title={t.appVersion.soft.title} onClose={onDismiss}>
      <View style={styles.content}>
        <AppMark size={brandMarkSizes.default} />
        <ThemedText variant="body" style={[styles.body, { color: colors.textSubtle }]}>
          {t.appVersion.soft.body.replace('{latest}', verdict.latestVersion ?? CharConstants.empty)}
        </ThemedText>
        <View style={styles.actions}>
          <PrimaryButton label={t.appVersion.soft.update} onPress={() => openStore(verdict.storeUrl)} />
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel={t.appVersion.soft.notNow}
            style={styles.notNow}
          >
            <ThemedText variant="body" style={styles.notNowLabel}>
              {t.appVersion.soft.notNow}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xl },
  body: { textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.lg2 },
  actions: { alignSelf: 'stretch', gap: spacing.sm },
  notNow: {
    minHeight: controlSizes.buttonSm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notNowLabel: { fontWeight: fontWeights.semibold, textAlign: 'center' },
});
