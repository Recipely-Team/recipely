import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, borderWidths } from '@presentation/base/theme';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { ImportProgressRing } from '@presentation/app/import-recipe/body/import-progress-ring';
import { ImportStageList } from '@presentation/app/import-recipe/body/import-stage-list';
import { ImportStatusPill } from '@presentation/app/import-recipe/items/import-status-pill';
import { appImportLook } from '@presentation/app/import-recipe/model/app-import-look';
import { ImportDish } from '@presentation/app/import-recipe/model/import-dish';
import { FILE_STAGE_KEYS } from '@presentation/app/import-recipe/model/file/file-stage-keys';

export interface FileReadingViewProps {
  /** 0..stage count — how far the checklist has filled. */
  activeStage: number;
  isDone: boolean;
  /** "your PDF", "your 3 photos" — what the body sentence says is being read. */
  subject: string;
  /** How many pages were sent, or the PDF label. */
  pagesLabel: string;
  /** Leaves the screen. The reading runs on and its draft still lands, so this is Close, never Cancel. */
  onClose: () => void;
}

const WHAT_TOKEN = '{what}';

/**
 * The reading, as the link import's queue screen draws a wait: the ring, a
 * status pill, a checklist and the numbers — in the app's own colours, since
 * the pages came from the user rather than a platform.
 */
export const FileReadingView = ({
  activeStage,
  isDone,
  subject,
  pagesLabel,
  onClose,
}: FileReadingViewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const scrollable = useAssistantScrollable();
  const copy = t().fileImport;
  const importCopy = t().importRecipe;
  const look = appImportLook(colors);
  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }];
  const stats = [
    { key: copy.statPages, value: pagesLabel },
    { key: importCopy.estimate, value: copy.estimateValue },
  ];

  return (
    <>
      <ScrollView {...scrollable} style={styles.scroll} contentContainerStyle={styles.content}>
        <ImportProgressRing
          progress={activeStage / FILE_STAGE_KEYS.length}
          done={isDone}
          look={look}
          dish={ImportDish.Document}
        />
        <View style={styles.heading}>
          <ImportStatusPill label={isDone ? importCopy.ready : importCopy.webReading} done={isDone} look={look} />
          <ThemedText variant="title" style={styles.centered}>
            {isDone ? importCopy.ready : copy.readTitle}
          </ThemedText>
          <ThemedText variant="body" style={[styles.centered, { color: colors.textMuted }]}>
            {isDone ? importCopy.readyBody : copy.readBody.replace(WHAT_TOKEN, subject)}
          </ThemedText>
        </View>
        <ImportStageList
          activeStage={activeStage}
          labels={FILE_STAGE_KEYS.map((key) => copy[key])}
          accent={look.accent}
        />
        <View style={styles.row}>
          {stats.map((stat) => (
            <View key={stat.key} style={[card, styles.stat]}>
              <ThemedText variant="caption" style={[styles.key, { color: colors.textMuted }]}>
                {stat.key}
              </ThemedText>
              <ThemedText variant="subtitle">{stat.value}</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label={t().common.close} onPress={onClose} disabled={isDone} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
  centered: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm2,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  stat: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
  },
  key: {
    fontWeight: fontWeights.semibold,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
});
