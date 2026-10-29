import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, BackHandler, findNodeHandle, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from 'zustand';
import type { VersionVerdict } from '@domain/app-version/version-verdict';
import { UpdateRequiredReason } from '@domain/app-version/update-required-reason';
import { CharConstants, ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { brandMarkSizes, controlSizes, fontWeights, layoutSizes, spacing, zIndices } from '@presentation/base/theme';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { AppMark } from '@presentation/base/widgets/app-update/app-mark';
import { openStore } from '@presentation/base/utils/open-store';
import { appVersion } from '@presentation/base/utils/app-version';
import { useTranslations } from '@presentation/i18n';

export interface UpdateRequiredGateProps {
  verdict: VersionVerdict;
}

/**
 * Replaces the whole app when this build must update — unsupported, or a
 * release that was pulled.
 *
 * @remarks
 * - **Nothing behind it can be reached.** It covers every layer (tab bar, timers,
 *   assistant, splash), is the only thing a screen reader sees, and Android's
 *   back button does nothing while it is up.
 * - **This is the UX half.** The backend answers `426` to every request from
 *   this build anyway; the gate only says why and where to go.
 * - **Try again re-asks the backend**, for the user who updated from another
 *   device's store page or whose release was un-pulled; the foreground check
 *   does the same on return from the store.
 */
export const UpdateRequiredGate = ({ verdict }: UpdateRequiredGateProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isExpanded } = useLayout();
  const { appVersionStore } = useStores();
  const check = useStore(appVersionStore, (s) => s.check);
  const [isChecking, setChecking] = useState(false);
  const titleRef = useRef<View>(null);
  const isBlocked = verdict.reason === UpdateRequiredReason.Blocked;
  const required = (isBlocked ? verdict.latestVersion : verdict.minimumVersion) ?? verdict.latestVersion ?? CharConstants.empty;
  const versionValues = { current: appVersion, required };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    const node = titleRef.current === null ? null : findNodeHandle(titleRef.current);
    if (node !== null) AccessibilityInfo.setAccessibilityFocus(node);
    return () => subscription.remove();
  }, []);

  const tryAgain = (): void => {
    setChecking(true);
    void check().finally(() => setChecking(false));
  };

  return (
    <View
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (isExpanded ? spacing.xxxl : spacing.xxl),
            paddingBottom: insets.bottom + (isExpanded ? spacing.xxxl : spacing.xl),
            paddingHorizontal: isExpanded ? spacing.xxxl : spacing.xl,
          },
        ]}
      >
        <View style={[styles.column, { maxWidth: isExpanded ? layoutSizes.updateGateMaxWidthTablet : layoutSizes.updateGateMaxWidth }]}>
          <AppMark size={isExpanded ? brandMarkSizes.updateGateTablet : brandMarkSizes.heroLandscape} badgeReason={verdict.reason} />
          <View ref={titleRef} accessible accessibilityRole="header" style={{ marginTop: isExpanded ? spacing.xxl : spacing.xl }}>
            <ThemedText variant={isExpanded ? 'headline' : 'title'} style={styles.title}>
              {t.appVersion.required.title}
            </ThemedText>
          </View>
          <ThemedText variant="body" style={[styles.centered, { color: colors.textSubtle }]}>
            {isBlocked ? t.appVersion.required.blockedBody : t.appVersion.required.body}
          </ThemedText>
          {required.length > ValueConstants.zero ? (
            <ThemedText
              variant="caption"
              accessibilityLabel={t.appVersion.required.versionsA11y.replace('{current}', versionValues.current).replace('{required}', versionValues.required)}
              style={[styles.centered, styles.versions, { color: colors.textSubtle }]}
            >
              {t.appVersion.required.versions.replace('{current}', versionValues.current).replace('{required}', versionValues.required)}
            </ThemedText>
          ) : null}
          <View style={[styles.actions, { marginTop: isExpanded ? spacing.xxl : spacing.xxl }]}>
            <PrimaryButton label={t.appVersion.required.updateNow} onPress={() => openStore(verdict.storeUrl)} />
            <Pressable
              onPress={tryAgain}
              disabled={isChecking}
              accessibilityRole="button"
              accessibilityLabel={t.appVersion.required.tryAgain}
              accessibilityHint={t.appVersion.a11y.tryHint}
              accessibilityState={{ busy: isChecking, disabled: isChecking }}
              style={styles.tryAgain}
            >
              <ThemedText variant="body" style={[styles.tryAgainLabel, { color: colors.primary }]}>
                {t.appVersion.required.tryAgain}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { zIndex: zIndices.updateGate },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  column: { width: '100%', alignItems: 'center' },
  title: { textAlign: 'center', fontWeight: fontWeights.heavy, marginBottom: spacing.sm2 },
  centered: { textAlign: 'center' },
  versions: { marginTop: spacing.md, fontVariant: ['tabular-nums'] },
  actions: { alignSelf: 'stretch', gap: spacing.xs2 },
  tryAgain: {
    minHeight: controlSizes.touchTarget,
    paddingVertical: spacing.sm2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryAgainLabel: { fontWeight: fontWeights.semibold, textDecorationLine: 'underline', textAlign: 'center' },
});
