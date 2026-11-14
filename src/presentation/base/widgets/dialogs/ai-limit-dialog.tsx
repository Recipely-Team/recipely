import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from 'zustand';
import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AiLimitScope } from '@domain/subscriptions/ai-limit-scope';
import { AiFreePlanLimits } from '@domain/subscriptions/ai-free-plan-limits';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { AiLimitUsagePanel } from '@presentation/base/widgets/dialogs/ai-limit-usage-panel';
import { AiLimitMetrics } from '@presentation/base/widgets/dialogs/ai-limit-metrics';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes, fontSizes, fontWeights, lineHeights, opacities, radii, shadows, spacing } from '@presentation/base/theme';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { useTranslations } from '@presentation/i18n';
import { useLocale } from '@presentation/i18n/use-locale';
import { ValueConstants } from '@core/constants';

/**
 * **"Daily AI limit reached"** — the free plan's cap, from any screen
 * (Board · Premium and AI Limit, spec §2).
 *
 * @remarks
 * - **Raised by the HTTP client**, through `aiLimitStore`, the moment an AI
 *   endpoint refuses a request for the cap; the screen that asked still shows
 *   its own failure underneath.
 * - **The server's numbers**: the scope, the count and the reset time come
 *   from the 429; only the free plan's note is the app's copy of the plan.
 * - **Leaving is "Got it"**: the button, the scrim and Android back all close
 *   it. Upgrade closes it before opening the paywall, so the two never stack.
 * - **Any navigation closes it** — the voice assistant's "open Premium" goes
 *   through the router, not this button, and must not leave it over the paywall.
 */
export const AiLimitDialog = (): React.JSX.Element | null => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const colors = useTheme().colors;
  const { aiLimitStore } = useStores();
  const limit = useStore(aiLimitStore, (s) => s.limit);
  const pathname = usePathname();
  // A store write keyed on the route, not a mirrored state: leaving the screen closes the dialog.
  useEffect(() => () => aiLimitStore.getState().dismiss(), [pathname, aiLimitStore]);
  if (limit === null) return null;
  const copy = t.aiLimit;
  const isDaily = limit.scope === AiLimitScope.Daily;
  const dismiss = (): void => aiLimitStore.getState().dismiss();
  const upgrade = (): void => {
    dismiss();
    router.push(RoutePaths.premium);
  };
  const note = copy.planNote
    .replace('{daily}', formatWholeNumber(AiFreePlanLimits.daily, locale))
    .replace('{monthly}', formatWholeNumber(AiFreePlanLimits.monthly, locale));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} onPress={dismiss} accessibilityRole="button" accessibilityLabel={copy.gotIt} />
        <View accessibilityViewIsModal accessibilityRole="alert" style={[styles.card, shadows.lg, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.content} bounces={false}>
            <View style={[styles.tile, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="sparkles" size={AiLimitMetrics.iconGlyph} color={colors.primary} />
            </View>
            <SizedText accessibilityRole="header" size={fontSizes.subheading} weight={fontWeights.bold} ratio={lineHeights.tight} style={styles.title}>
              {isDaily ? copy.titleDaily : copy.titleMonthly}
            </SizedText>
            <SizedText size={fontSizes.body} ratio={lineHeights.normal} color={colors.textSubtle}>
              {(isDaily ? copy.bodyDaily : copy.bodyMonthly).replace('{limit}', formatWholeNumber(limit.limit, locale))}
            </SizedText>
            <AiLimitUsagePanel limit={limit} />
            <SizedText size={fontSizes.caption} color={colors.textSubtle} style={styles.note}>
              {note}
            </SizedText>
            <View style={styles.actions}>
              <Pressable
                onPress={upgrade}
                accessibilityRole="button"
                style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed ? opacities.pressed : opacities.full }]}
              >
                <SizedText size={fontSizes.body} weight={fontWeights.bold} color={colors.primaryText}>
                  {copy.upgrade}
                </SizedText>
              </Pressable>
              <Pressable
                onPress={dismiss}
                accessibilityRole="button"
                style={({ pressed }) => [styles.secondary, { opacity: pressed ? opacities.pressed : opacities.full }]}
              >
                <SizedText size={fontSizes.body} weight={fontWeights.semibold}>
                  {copy.gotIt}
                </SizedText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: ValueConstants.one, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: AiLimitMetrics.cardMaxWidth, maxHeight: AiLimitMetrics.cardMaxHeightShare, borderRadius: radii.xxl },
  content: { paddingTop: spacing.xl, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  tile: {
    width: AiLimitMetrics.iconTile,
    height: AiLimitMetrics.iconTile,
    borderRadius: AiLimitMetrics.iconTileRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: spacing.md, marginBottom: spacing.xs },
  note: { marginTop: spacing.sm },
  actions: { marginTop: spacing.lg, gap: spacing.xs },
  primary: { minHeight: controlSizes.button, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  secondary: { minHeight: controlSizes.touchTarget, alignItems: 'center', justifyContent: 'center' },
});
