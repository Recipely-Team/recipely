import { StyleSheet, View } from 'react-native';
import { GeneratingVariant } from '@presentation/app/create-recipe/model/generation/generating-variant';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, iconSizes, decorSizes, layoutSizes, borderWidths, opacities } from '@presentation/base/theme';
import { useGeneratingAnimation } from '@presentation/app/create-recipe/hooks/use-generating-animation';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { AnimationConstants } from '@presentation/base/constants';

export interface GeneratingViewProps {
  /** 0..(steps-1) — drives the checklist fill and progress bar. */
  activeStep: number;
  /** Which flow's copy + step labels to show. Defaults to `generate`. */
  variant?: GeneratingVariant;
}

const STAGE = 188;
const CORE = 104;
const ORBIT_RADIUS = 90;
const ORBIT_COUNT = 6;
/**
 * Import never reports 100%: the backend keeps working after the last named
 * step, so the bar parks just short of full and keeps pulsing rather than
 * claiming to be done.
 */
const IMPORT_PROGRESS_CAP = 0.92;
/** Even spacing of the orbiting dots around the full circle. */
const ORBIT_STEP_DEG = 360 / ORBIT_COUNT;
/** Faintest orbiting dot, and the step that fans the rest brighter. */
const ORBIT_DOT_MIN_OPACITY = 0.35;
const ORBIT_DOT_OPACITY_STEP = 0.22;
/** Dots repeat their brightness every third position. */
const ORBIT_DOT_OPACITY_CYCLE = 3;
const GENERATE_STEP_KEYS = ['gen0', 'gen1', 'gen2', 'gen3', 'gen4'] as const;
const IMPORT_STEP_KEYS = ['import0', 'import1', 'import2', 'import3'] as const;
const LOGO_SIZE = 60;

/** The eye-catching "AI is cooking" showpiece shown while a recipe generates. */
export const GeneratingView = ({
  activeStep,
  variant = 'generate',
}: GeneratingViewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { orbitStyle, ringStyle, coreStyle } = useGeneratingAnimation();

  const copy = t().createRecipe;
  const isImport = variant === GeneratingVariant.Import;
  const steps = isImport
    ? IMPORT_STEP_KEYS.map((key) => copy[key])
    : GENERATE_STEP_KEYS.map((key) => copy[key]);
  const title = isImport ? copy.importTitle : copy.genTitle;
  const sub = isImport ? copy.importSub : copy.genSub;
  // Import runs long; clamp the spotlight to the final step so it keeps pulsing
  // instead of "completing" and sitting idle while the backend finishes.
  const lastStep = steps.length - ValueConstants.one;
  const spotlight = isImport ? Math.min(activeStep, lastStep) : activeStep;
  const progress = isImport
    ? Math.min(IMPORT_PROGRESS_CAP, (spotlight + ValueConstants.one) / steps.length)
    : Math.min(AnimationConstants.progressMax, (activeStep + ValueConstants.one) / steps.length);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.ring,
            { borderColor: colors.primary, borderTopColor: colors.primaryGradientEnd },
            ringStyle,
          ]}
        />
        <Animated.View style={[styles.orbit, orbitStyle]}>
          {Array.from({ length: ORBIT_COUNT }).map((_, n) => (
            <View
              key={n}
              style={[
                styles.dot,
                {
                  backgroundColor: colors.primary,
                  opacity: ORBIT_DOT_MIN_OPACITY + (n % ORBIT_DOT_OPACITY_CYCLE) * ORBIT_DOT_OPACITY_STEP,
                  transform: [{ rotate: `${n * ORBIT_STEP_DEG}deg` }, { translateX: ORBIT_RADIUS }],
                },
              ]}
            />
          ))}
        </Animated.View>
        <Animated.View style={coreStyle}>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
            end={{ x: ValueConstants.one, y: ValueConstants.one }}
            style={[styles.core, shadows.lg]}
          >
            <RecipelyLogo size={LOGO_SIZE} monochrome mono={colors.primaryText} />
            <View style={styles.twinkle}>
              <Ionicons name="sparkles" size={iconSizes.xl} color={colors.primaryText} />
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={styles.heading}>
        <ThemedText variant="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText variant="body" style={[styles.sub, { color: colors.textMuted }]}>
          {sub}
        </ThemedText>
      </View>

      <View style={styles.checklist}>
        {steps.map((label, i) => {
          const done = i < spotlight;
          const active = i === spotlight;
          return (
            <View key={label} style={[styles.checkRow, { opacity: done || active ? opacities.full : opacities.inactive }]}>
              <View
                style={[
                  styles.checkBadge,
                  {
                    backgroundColor: done ? colors.primary : 'transparent',
                    borderColor: active ? colors.primary : colors.border,
                    borderWidth: done ? ValueConstants.zero : borderWidths.thin,
                  },
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={iconSizes.md} color={colors.primaryText} />
                ) : active ? (
                  <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
              <ThemedText
                style={[
                  styles.checkLabel,
                  {
                    color: active || done ? colors.text : colors.textMuted,
                    fontWeight: active ? '700' : '500',
                  },
                ]}
              >
                {label}
              </ThemedText>
            </View>
          );
        })}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
            end={{ x: ValueConstants.one, y: ValueConstants.zero }}
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  stage: {
    width: STAGE,
    height: STAGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: STAGE,
    height: STAGE,
    borderRadius: STAGE / ValueConstants.two,
    borderWidth: borderWidths.thick,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  orbit: {
    position: 'absolute',
    width: STAGE,
    height: STAGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radii.round,
  },
  core: {
    width: CORE,
    height: CORE,
    borderRadius: radii.xxl2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twinkle: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
  },
  heading: {
    alignItems: 'center',
    maxWidth: layoutSizes.maxContentXs,
  },
  title: {
    textAlign: 'center',
  },
  sub: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  checklist: {
    width: '100%',
    maxWidth: layoutSizes.maxContentSm,
    gap: spacing.sm2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkBadge: {
    width: decorSizes.badgeSm,
    height: decorSizes.badgeSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radii.round,
  },
  checkLabel: {
    fontSize: fontSizes.medium,
  },
  progressTrack: {
    height: spacing.xs,
    borderRadius: radii.round,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    height: spacing.xs,
    borderRadius: radii.round,
  },
});
