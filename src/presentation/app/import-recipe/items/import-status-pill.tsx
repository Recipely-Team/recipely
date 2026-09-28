import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, letterSpacings } from '@presentation/base/theme';
import { upperCase } from '@presentation/i18n/upper-case';
import { ValueConstants } from '@core/constants';
import type { ImportLook } from '@presentation/app/import-recipe/model/import-look';

export interface ImportStatusPillProps {
  label: string;
  /** Green once the draft is ready; the source's colours until then. */
  done: boolean;
  look: ImportLook;
}

const STATUS_DOT = 6;
const GRADIENT_START = { x: ValueConstants.zero, y: ValueConstants.one };
const GRADIENT_END = { x: ValueConstants.one, y: ValueConstants.zero };

/** The import's status in one uppercase word, in the source's colours. */
export const ImportStatusPill = ({ label, done, look }: ImportStatusPillProps): React.JSX.Element => {
  const colors = useTheme().colors;

  if (done) {
    return (
      <View style={[styles.pill, { backgroundColor: colors.successLight }]}>
        <View style={[styles.dot, { backgroundColor: colors.success }]} />
        <ThemedText variant="caption" style={[styles.label, { color: colors.success }]}>
          {upperCase(label)}
        </ThemedText>
      </View>
    );
  }

  return (
    <LinearGradient colors={[...look.pill]} start={GRADIENT_START} end={GRADIENT_END} style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: look.pillText }]} />
      <ThemedText variant="caption" style={[styles.label, { color: look.pillText }]}>
        {upperCase(label)}
      </ThemedText>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radii.round,
  },
  dot: {
    width: STATUS_DOT,
    height: STATUS_DOT,
    borderRadius: radii.round,
  },
  label: {
    fontSize: fontSizes.nano,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wider,
  },
});
