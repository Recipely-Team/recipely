import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import type { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { spacing, fontWeights, opacities } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

const DISC_SIZE = 104;
const DISC_ICON_SIZE = 46;
const ACTION_MAX_WIDTH = 240;
const BODY_MAX_WIDTH = 260;

export interface ErrorStateProps {
  severity?: SeverityType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Small, optional monospace diagnostic code shown under the actions. */
  code?: string;
}

/**
 * The core full-screen error / empty / not-found state from the Recipely "Error
 * States" design: a severity-tinted illustration disc, a warm title, a plain
 * body, and always at least one way out. Severity drives the disc/icon color
 * only — text stays in the regular theme palette for maximum legibility.
 */
export const ErrorState = ({
  severity = 'danger',
  icon,
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  code,
}: ErrorStateProps): React.JSX.Element => {
  const surface = useSeveritySurfaces()[severity];

  return (
    <View style={styles.root}>
      <View style={[styles.disc, { backgroundColor: surface.disc }]}>
        <Ionicons name={icon} size={DISC_ICON_SIZE} color={surface.icon} />
      </View>
      <ThemedText variant="title" style={styles.title}>
        {title}
      </ThemedText>
      {body !== undefined ? (
        <ThemedText variant="body" muted style={styles.body}>
          {body}
        </ThemedText>
      ) : null}
      {primaryLabel !== undefined && onPrimary !== undefined ? (
        <View style={styles.primary}>
          <PrimaryButton label={primaryLabel} onPress={onPrimary} />
        </View>
      ) : null}
      {secondaryLabel !== undefined && onSecondary !== undefined ? (
        <ThemedText
          variant="body"
          muted
          style={styles.secondary}
          onPress={onSecondary}
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
        >
          {secondaryLabel}
        </ThemedText>
      ) : null}
      {code !== undefined ? (
        <ThemedText variant="caption" muted style={styles.code}>
          {code}
        </ThemedText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  disc: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: DISC_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg2,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    textAlign: 'center',
    maxWidth: BODY_MAX_WIDTH,
    marginBottom: spacing.lg2,
  },
  primary: {
    width: '100%',
    maxWidth: ACTION_MAX_WIDTH,
  },
  secondary: {
    marginTop: spacing.md,
    fontWeight: fontWeights.semibold,
  },
  code: {
    marginTop: spacing.md,
    fontFamily: 'monospace',
    opacity: opacities.pressedStrong,
  },
});
