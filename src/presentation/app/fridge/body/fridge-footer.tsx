import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { GradientCta } from '@presentation/app/fridge/items/buttons/gradient-cta';
import { GhostButton } from '@presentation/app/fridge/items/buttons/ghost-button';
import { FridgeStep } from '@presentation/app/fridge/model/flow/fridge-step';
import type { FridgeFlowState } from '@presentation/app/fridge/model/flow/fridge-flow-state';
import { borderWidths, controlSizes, spacing } from '@presentation/base/theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface FridgeFooterProps {
  state: FridgeFlowState;
  onFindIngredients: () => void;
  onCancel: () => void;
  onShowIdeas: () => void;
}

/**
 * The flow's footer (design spec → Cook from my fridge, Layout): one action
 * per step under a `cardBorder` rule — *Find ingredients* (disabled until a
 * photo; *Try again* after a failed scan), *Cancel* while analysing, *Show
 * recipe ideas* (disabled, "Add at least one ingredient", with no chips).
 * The ideas step and the full-screen states carry their own actions.
 */
export const FridgeFooter = ({ state, onFindIngredients, onCancel, onShowIdeas }: FridgeFooterProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isExpanded } = useLayout();
  const strings = t().fridge;
  const { view } = state;

  let action: React.JSX.Element | null = null;
  if (view.step === FridgeStep.Capture) {
    const failed = view.failure !== null;
    action = (
      <GradientCta
        label={failed ? strings.tryAgain : strings.findIngredients}
        icon={failed ? 'refresh' : 'scan-outline'}
        onPress={onFindIngredients}
        disabled={state.photos.length === ValueConstants.zero}
      />
    );
  } else if (view.step === FridgeStep.Analysing) {
    action = <GhostButton label={strings.cancel} onPress={onCancel} />;
  } else if (view.step === FridgeStep.Ingredients) {
    const empty = state.chips.length === ValueConstants.zero;
    action = <GradientCta label={empty ? strings.addAtLeastOne : strings.showIdeas} icon="sparkles" onPress={onShowIdeas} disabled={empty} />;
  }
  if (action === null) return null;

  return (
    <View
      style={[styles.footer, isExpanded ? null : styles.orbClearance, { borderTopColor: colors.cardBorder, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
    >
      <View style={styles.column}>{action}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: { paddingTop: spacing.md, paddingHorizontal: spacing.lg, borderTopWidth: borderWidths.hairline },
  /** On a narrow window the voice assistant's orb floats at the bottom right; the button stops short of it. */
  orbClearance: { paddingRight: spacing.lg + controlSizes.touchTarget + spacing.sm },
  column: { width: '100%', maxWidth: WEB_CONTENT_MAX_WIDTH.fridge, alignSelf: 'center' },
});
