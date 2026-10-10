import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { FridgeProgress } from '@presentation/app/fridge/model/flow/fridge-progress';
import { controlSizes, fontSizes, fontWeights, fridgeSizes, radii, spacing } from '@presentation/base/theme';
import { WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface FridgeHeaderProps {
  /** Which of the three steps this screen counts as (1–3). */
  step: number;
  /** A close (×) on step 1 and the full-screen states, a back arrow otherwise. */
  isClose: boolean;
  onBack: () => void;
}

/**
 * The fridge flow's header (design spec → Cook from my fridge, Layout): back
 * or close 40, the title centred, "n/3", and three 4 pt progress segments
 * (`primary` up to the current step, `skeleton` after), in the same 560
 * column as the body.
 */
export const FridgeHeader = ({ step, isClose, onBack }: FridgeHeaderProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().fridge;
  return (
    <View style={styles.root}>
      <View style={styles.column}>
        <View style={styles.row}>
          <RoundIconButton
            icon={isClose ? 'close' : 'arrow-back'}
            accessibilityLabel={isClose ? t().common.close : t().common.back}
            onPress={onBack}
            size={controlSizes.iconBtn}
            padToTouchTarget
          />
          <SizedText size={fontSizes.heading} weight={fontWeights.bold} style={styles.title} accessibilityRole="header">
            {strings.title}
          </SizedText>
          <SizedText
            size={fontSizes.caption}
            weight={fontWeights.bold}
            color={colors.textMuted}
            accessibilityLabel={strings.stepA11y.replace('{n}', String(step))}
            style={styles.counter}
          >
            {strings.stepCounter.replace('{n}', String(step))}
          </SizedText>
        </View>
        <View style={styles.progress} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {Array.from({ length: FridgeProgress.total }, (_, index) => (
            <View key={index} style={[styles.segment, { backgroundColor: index < step ? colors.primary : colors.skeleton }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  /** The header lines up with the flow's reading column on a wide window. */
  column: { gap: spacing.sm, width: '100%', maxWidth: WEB_CONTENT_MAX_WIDTH.fridge, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: ValueConstants.one, textAlign: 'center' },
  counter: { minWidth: controlSizes.iconBtn, textAlign: 'right' },
  progress: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: ValueConstants.one, height: fridgeSizes.progressSegment, borderRadius: radii.xs },
});
