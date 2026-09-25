import { HOST_TOKEN } from '@presentation/app/import-recipe/model/host-token';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { SourcePlatform, type SourcePlatformType } from '@domain/recipes/provenance/source-platform';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { provenanceSealMetrics } from '@presentation/base/widgets/badges/provenance-seal-metrics';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontWeights,
  iconSizes,
  borderWidths,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ImportStatusPill } from '@presentation/app/import-recipe/items/import-status-pill';
import { ValueConstants } from '@core/constants';
import type { ImportLook } from '@presentation/app/import-recipe/model/import-look';

export interface ImportQueueHeadingProps {
  jobStatus: ImportJobStatus | null;
  isDone: boolean;
  /** 1-based place in the queue, or null when the job is not waiting. */
  queuePosition: number | null;
  platform: SourcePlatformType;
  host: string;
  look: ImportLook;
}

/** Placeholder the queue-position sentence carries in every catalogue. */
const POSITION_TOKEN = '{position}';

/**
 * The status pill, where the link came from, and what is happening to it.
 *
 * @remarks
 * - **The queue position only while genuinely waiting.** A position on a job
 *   that has already started is a number about a line the user has left. A web
 *   page is read in seconds and never shows one.
 * - **A web page names its site under the pill**, beside the globe seal: the
 *   Instagram gradient is recognisable on its own, the app's own palette says
 *   nothing about where the recipe came from.
 */
export const ImportQueueHeading = ({
  jobStatus,
  isDone,
  queuePosition,
  platform,
  host,
  look,
}: ImportQueueHeadingProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().importRecipe;
  const isWeb = platform === SourcePlatform.Web;

  const statusLabel = isDone
    ? copy.ready
    : isWeb
      ? copy.webReading
      : jobStatus === ImportJobStatus.Running
        ? copy.working
        : copy.queued;
  const showsPosition = !isWeb && !isDone && jobStatus === ImportJobStatus.Queued && queuePosition !== null;
  const title = isDone ? copy.ready : isWeb ? copy.webTitle.replace(HOST_TOKEN, host) : copy.title;
  const body = isDone ? copy.readyBody : isWeb ? copy.webBody : copy.body;

  return (
    <View style={styles.heading}>
      <ImportStatusPill label={statusLabel} done={isDone} look={look} />

      {isWeb ? (
        <View style={styles.origin}>
          <ProvenanceSeal marks={[platform]} surface={SealSurface.Page} size={provenanceSealMetrics.pageSize} />
          <ThemedText variant="caption" style={styles.originLabel}>
            {host}
          </ThemedText>
        </View>
      ) : null}

      {showsPosition ? (
        <View style={[styles.positionChip, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Ionicons name="people-outline" size={iconSizes.sm} color={colors.textMuted} />
          <ThemedText variant="caption" style={{ color: colors.textMuted }}>
            {copy.queuePosition.replace(POSITION_TOKEN, String(queuePosition))}
          </ThemedText>
        </View>
      ) : null}

      <ThemedText variant="title" style={styles.centered}>
        {title}
      </ThemedText>
      <ThemedText variant="body" style={[styles.centered, { color: colors.textMuted }]}>
        {body}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  origin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  originLabel: {
    flexShrink: ValueConstants.one,
    fontWeight: fontWeights.semibold,
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
  centered: {
    textAlign: 'center',
  },
});
