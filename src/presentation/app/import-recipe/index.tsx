import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isString } from '@core/guards/type-guards';
import { useLocalSearchParams } from 'expo-router';
import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { ScreenContainer } from '@presentation/base/widgets/layout/screen-container';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import {
  failureContent,
  failureIcon,
  failureSeverity,
} from '@presentation/base/errors/failure-lookups';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  letterSpacings,
  iconSizes,
  borderWidths,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import { useReportFailure } from '@presentation/base/errors/use-report-failure';
import { useImportRecipe } from '@presentation/app/import-recipe/hooks/use-import-recipe';
import { ImportSourceChip } from '@presentation/app/import-recipe/body/import-source-chip';
import { ImportProgressRing } from '@presentation/app/import-recipe/body/import-progress-ring';
import { ImportStageList } from '@presentation/app/import-recipe/body/import-stage-list';
import { ValueConstants } from '@core/constants';

const STATUS_DOT = 6;

/**
 * Where a shared Instagram reel lands: a queue receipt, not a wait.
 *
 * The job runs on a worker and finishes whether or not this screen is open —
 * so the primary action is "notify me", and everything here is about making the
 * minute or two legible for a user who chooses to stand and watch.
 */
export const ImportRecipeScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const params = useLocalSearchParams<{ importUrl?: string }>();
  const importUrl = isString(params.importUrl) ? params.importUrl : undefined;
  const vm = useImportRecipe(importUrl);
  const copy = t().importRecipe;
  useReportFailure(vm.failure, 'ImportRecipeScreen');

  if (vm.failure !== null) {
    const content = failureContent(vm.failure);
    return (
      <ScreenContainer scrollable={false}>
        <ErrorState
          severity={failureSeverity(vm.failure)}
          icon={failureIcon(vm.failure)}
          title={copy.failTitle}
          body={content.body}
          primaryLabel={vm.canRetry ? t().common.retry : t().common.cancel}
          onPrimary={vm.canRetry ? vm.onRetry : vm.onClose}
          secondaryLabel={vm.canRetry ? t().common.cancel : undefined}
          onSecondary={vm.canRetry ? vm.onClose : undefined}
        />
      </ScreenContainer>
    );
  }

  const statusLabel = vm.isDone
    ? copy.ready
    : vm.jobStatus === ImportJobStatus.Running
      ? copy.working
      : copy.queued;
  const statusColor = vm.isDone ? colors.success : colors.primary;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenContainer scrollable={false} padded={false}>
        <ResponsiveContainer route="importRecipe" gutter={false} fill>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <ImportSourceChip />

            <ImportProgressRing progress={vm.progress} done={vm.isDone} />

            <View style={styles.heading}>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: vm.isDone ? colors.successLight : colors.chipBackground,
                  },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <ThemedText
                  variant="caption"
                  style={[styles.statusLabel, { color: vm.isDone ? colors.success : colors.chipText }]}
                >
                  {upperCase(statusLabel)}
                </ThemedText>
              </View>

              <ThemedText variant="title" style={styles.title}>
                {vm.isDone ? copy.ready : copy.title}
              </ThemedText>
              <ThemedText variant="body" style={[styles.body, { color: colors.textMuted }]}>
                {vm.isDone ? copy.readyBody : copy.body}
              </ThemedText>
            </View>

            <ImportStageList activeStage={vm.activeStage} />

            <View
              style={[
                styles.estimate,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              <ThemedText variant="caption" style={{ color: colors.textMuted }}>
                {copy.estimate}
              </ThemedText>
              <ThemedText variant="subtitle">{copy.estimateValue}</ThemedText>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              label={vm.isDone ? copy.openDraft : copy.notify}
              onPress={vm.isDone ? vm.onOpenDraft : vm.onClose}
              loading={vm.isQueueing}
            />
            <View style={styles.hint}>
              <Ionicons name="information-circle-outline" size={iconSizes.sm} color={colors.textMuted} />
              <ThemedText variant="caption" style={{ color: colors.textMuted }}>
                {copy.background}
              </ThemedText>
            </View>
          </View>
        </ResponsiveContainer>
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
  },
  // flex:1 so the footer keeps its place at the bottom instead of being pushed
  // off by the scroll body.
  scroll: {
    flex: ValueConstants.one,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
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

export default ImportRecipeScreen;
