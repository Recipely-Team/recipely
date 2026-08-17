import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  letterSpacings,
  iconSizes,
  borderWidths,
  BrandColors,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import { ImportProgressRing } from '@presentation/app/import-recipe/body/import-progress-ring';
import { ImportStageList } from '@presentation/app/import-recipe/body/import-stage-list';
import { LinearGradient } from 'expo-linear-gradient';
import type { ImportJobStatus as ImportJobStatusType } from '@domain/recipes/import/import-job-status';
import { ValueConstants } from '@core/constants';

export interface ImportQueueViewProps {
  jobStatus: ImportJobStatusType | null;
  activeStage: number;
  progress: number;
  isDone: boolean;
  isQueueing: boolean;
  /** 1-based place in the queue, or null when the job is not waiting. */
  queuePosition: number | null;
  onPrimary: () => void;
}

const STATUS_DOT = 6;
/** Placeholder the queue-position sentence carries in every catalogue. */
const POSITION_TOKEN = '{position}';
const GRADIENT_START = { x: ValueConstants.zero, y: ValueConstants.one };
const GRADIENT_END = { x: ValueConstants.one, y: ValueConstants.zero };
const INSTAGRAM_STOPS = [
  BrandColors.instagramGradientStart,
  BrandColors.instagramGradientWarm,
  BrandColors.instagramGradientMid,
  BrandColors.instagramGradientEnd,
] as const;

/**
 * The queue receipt: what a reel is doing, for a user who chose to watch.
 *
 * Nothing here is a wait the user owes — the primary action is "notify me", and
 * the job finishes whether or not this is on screen.
 */
export const ImportQueueView = ({
  jobStatus,
  activeStage,
  progress,
  isDone,
  isQueueing,
  queuePosition,
  onPrimary,
}: ImportQueueViewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().importRecipe;

  const statusLabel = isDone
    ? copy.ready
    : jobStatus === ImportJobStatus.Running
      ? copy.working
      : copy.queued;

  // Only while genuinely waiting. A position on a job that has already started
  // is a number about a line the user has left, and it is the difference
  // between "four ahead of you" and "yours is being made right now".
  const showsPosition = !isDone && jobStatus === ImportJobStatus.Queued && queuePosition !== null;

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ImportProgressRing progress={progress} done={isDone} />

        <View style={styles.heading}>
          {isDone ? (
            <View style={[styles.statusPill, { backgroundColor: colors.successLight }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <ThemedText variant="caption" style={[styles.statusLabel, { color: colors.success }]}>
                {upperCase(statusLabel)}
              </ThemedText>
            </View>
          ) : (
            <LinearGradient
              colors={[...INSTAGRAM_STOPS]}
              start={GRADIENT_START}
              end={GRADIENT_END}
              style={styles.statusPill}
            >
              <View style={[styles.statusDot, { backgroundColor: BrandColors.white }]} />
              <ThemedText
                variant="caption"
                style={[styles.statusLabel, { color: BrandColors.white }]}
              >
                {upperCase(statusLabel)}
              </ThemedText>
            </LinearGradient>
          )}

          {showsPosition ? (
            <View style={[styles.positionChip, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Ionicons name="people-outline" size={iconSizes.sm} color={colors.textMuted} />
              <ThemedText variant="caption" style={{ color: colors.textMuted }}>
                {copy.queuePosition.replace(POSITION_TOKEN, String(queuePosition))}
              </ThemedText>
            </View>
          ) : null}

          <ThemedText variant="title" style={styles.title}>
            {isDone ? copy.ready : copy.title}
          </ThemedText>
          <ThemedText variant="body" style={[styles.body, { color: colors.textMuted }]}>
            {isDone ? copy.readyBody : copy.body}
          </ThemedText>
        </View>

        <ImportStageList activeStage={activeStage} />

        <View
          style={[styles.estimate, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        >
          <ThemedText variant="caption" style={{ color: colors.textMuted }}>
            {copy.estimate}
          </ThemedText>
          <ThemedText variant="subtitle">{copy.estimateValue}</ThemedText>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={isDone ? copy.openDraft : copy.notify}
          onPress={onPrimary}
          loading={isQueueing}
        />
        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={iconSizes.sm} color={colors.textMuted} />
          <ThemedText variant="caption" style={{ color: colors.textMuted }}>
            {copy.background}
          </ThemedText>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  // flex:1 so the footer keeps its place at the bottom instead of being pushed
  // off by the scroll body.
  scroll: {
    flex: ValueConstants.one,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  heading: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radii.round,
  },
  statusDot: {
    width: STATUS_DOT,
    height: STATUS_DOT,
    borderRadius: radii.round,
  },
  statusLabel: {
    fontSize: fontSizes.nano,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wider,
  },
  positionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.xxs,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
  },
  estimate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm2,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
