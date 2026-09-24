import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SourcePlatform, type SourcePlatformType } from '@domain/recipes/provenance/source-platform';
import type { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, iconSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ImportProgressRing } from '@presentation/app/import-recipe/body/import-progress-ring';
import { ImportStageList } from '@presentation/app/import-recipe/body/import-stage-list';
import { ImportQueueHeading } from '@presentation/app/import-recipe/body/import-queue-heading';
import { ImportQueueStats } from '@presentation/app/import-recipe/body/import-queue-stats';
import { importLookFor } from '@presentation/app/import-recipe/model/import-look-for';
import { importStageKeysFor } from '@presentation/app/import-recipe/model/import-stage-keys';
import { ValueConstants } from '@core/constants';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';

export interface ImportQueueViewProps {
  jobStatus: ImportJobStatus | null;
  activeStage: number;
  progress: number;
  isDone: boolean;
  isQueueing: boolean;
  /** 1-based place in the queue, or null when the job is not waiting. */
  queuePosition: number | null;
  /** Where the link points, which decides the screen's colours, copy and checklist. */
  platform: SourcePlatformType;
  /** The site as a person names it, for a web page's title and stats. */
  host: string;
  onPrimary: () => void;
}

/**
 * The queue receipt: what a link is doing, for a user who chose to watch.
 *
 * @remarks
 * - **A video is a wait the user does not owe** — the primary action is
 *   "notify me", and the job finishes whether or not this is on screen.
 * - **A web page is read in seconds**, so there is no queue to leave and no
 *   notification to promise: the button is Cancel until the draft is ready,
 *   and the "runs in the background" note is gone.
 */
export const ImportQueueView = ({
  jobStatus,
  activeStage,
  progress,
  isDone,
  isQueueing,
  queuePosition,
  platform,
  host,
  onPrimary,
}: ImportQueueViewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const scrollable = useAssistantScrollable();
  const copy = t().importRecipe;
  const isWeb = platform === SourcePlatform.Web;
  const look = importLookFor(platform, colors);

  const primaryLabel = isDone ? copy.openDraft : isWeb ? copy.webCancel : copy.notify;

  return (
    <>
      <ScrollView {...scrollable} style={styles.scroll} contentContainerStyle={styles.content}>
        <ImportProgressRing progress={progress} done={isDone} look={look} isWeb={isWeb} />
        <ImportQueueHeading
          jobStatus={jobStatus}
          isDone={isDone}
          queuePosition={queuePosition}
          platform={platform}
          host={host}
          look={look}
        />
        <ImportStageList activeStage={activeStage} stageKeys={importStageKeysFor(platform)} accent={look.accent} />
        <ImportQueueStats isWeb={isWeb} host={host} />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label={primaryLabel} onPress={onPrimary} loading={isQueueing} />
        {isWeb ? null : (
          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={iconSizes.sm} color={colors.textMuted} />
            <ThemedText variant="caption" style={{ color: colors.textMuted }}>
              {copy.background}
            </ThemedText>
          </View>
        )}
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
