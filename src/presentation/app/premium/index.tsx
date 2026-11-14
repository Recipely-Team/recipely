import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, controlSizes } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';
import { PremiumProductIds } from '@application/subscriptions/premium-product-ids';
import { CharConstants } from '@core/constants';
import { PaywallPhase } from '@presentation/app/premium/model/paywall-phase';
import { PaywallMetrics } from '@presentation/app/premium/model/paywall-metrics';
import { usePaywall } from '@presentation/app/premium/hooks/use-paywall';
import { usePaywallAssistant } from '@presentation/app/premium/hooks/use-paywall-assistant';
import { PaywallBenefits } from '@presentation/app/premium/body/paywall-benefits';
import { PaywallActions } from '@presentation/app/premium/body/paywall-actions';
import { PlanCard } from '@presentation/app/premium/items/plan-card';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';

/**
 * Recipely Premium: the paywall (Board · Premium and AI Limit, specs §1).
 *
 * @remarks
 * - **Composition only.** The flow is `usePaywall`; voice is `usePaywallAssistant`.
 * - **Prices are the store's own strings.** Nothing here formats or invents a price;
 *   while the store answers, the price lines show a skeleton.
 */
export const PremiumScreen = (): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const paywall = usePaywall();
  usePaywallAssistant(paywall);
  const scrollable = useAssistantScrollable();

  const isChoosable = paywall.phase === PaywallPhase.Ready;
  const priceOf = (id: string): string | null => paywall.plans.find((plan) => plan.id === id)?.displayPrice ?? null;
  const plans = [
    { id: PremiumProductIds.Monthly, name: t.premium.monthly, period: t.premium.perMonth, bestValue: null },
    { id: PremiumProductIds.Yearly, name: t.premium.yearly, period: t.premium.perYear, bestValue: t.premium.bestValue },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <View style={styles.closeRow}>
        <Pressable
          onPress={paywall.close}
          accessibilityRole="button"
          accessibilityLabel={t.premium.maybeLater}
          style={[styles.close, { backgroundColor: colors.chipBackground }]}
        >
          <Ionicons name="close" size={iconSizes.lg} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView {...scrollable} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={[styles.tile, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={PaywallMetrics.iconGlyph} color={colors.primaryText} />
          </View>
          <ThemedText variant="headline" style={styles.title} accessibilityRole="header">
            {t.premium.title}
          </ThemedText>
          <ThemedText variant="body" style={[styles.subtitle, { color: colors.textSubtle }]}>
            {t.premium.subtitle}
          </ThemedText>
        </View>
        <PaywallBenefits benefits={[t.premium.benefitUnlimitedAi, t.premium.benefitNoAds]} />
        {paywall.phase === PaywallPhase.Unavailable ? null : (
          <View style={styles.plans} accessibilityRole="radiogroup">
            {plans.map((plan) => {
              const price = priceOf(plan.id);
              const shown = price === null ? CharConstants.empty : plan.period.replace('{price}', price);
              return (
                <PlanCard
                  key={plan.id}
                  name={plan.name}
                  price={shown}
                  isSelected={paywall.selected === plan.id}
                  bestValueLabel={plan.bestValue}
                  isDisabled={!isChoosable}
                  accessibilityLabel={[
                    t.premium.a11yPlan.replace('{plan}', plan.name).replace('{price}', shown),
                    ...(plan.bestValue === null ? [] : [t.premium.a11yBestValue]),
                  ].join(CharConstants.commaSpace)}
                  onPress={() => paywall.select(plan.id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
      <View style={styles.bottom}>
        <PaywallActions
          phase={paywall.phase}
          message={paywall.message}
          onContinue={() => void paywall.purchase()}
          onRestore={() => void paywall.restore()}
          onClose={paywall.close}
        />
      </View>
    </View>
  );
};

export default PremiumScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeRow: { flexDirection: 'row', paddingHorizontal: spacing.md },
  close: { width: controlSizes.settingsRow, height: controlSizes.settingsRow, borderRadius: radii.round, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, gap: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, width: '100%', maxWidth: PaywallMetrics.contentMaxWidth, alignSelf: 'center' },
  hero: { alignItems: 'center', gap: spacing.sm },
  tile: { width: PaywallMetrics.iconTile, height: PaywallMetrics.iconTile, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: fontWeights.heavy, textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  plans: { flexDirection: 'row', gap: spacing.md, marginTop: 'auto', paddingTop: spacing.md },
  bottom: { paddingHorizontal: spacing.xl, width: '100%', maxWidth: PaywallMetrics.contentMaxWidth, alignSelf: 'center' },
});
