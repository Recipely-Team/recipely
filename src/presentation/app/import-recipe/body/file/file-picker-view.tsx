import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Failure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import { ProvenanceMark } from '@domain/recipes/provenance/provenance-mark';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { provenanceSealMetrics } from '@presentation/base/widgets/badges/provenance-seal-metrics';
import { failureContent, failureIcon, failureSeverity } from '@presentation/base/errors/failure-lookups';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, iconSizes, controlSizes, borderWidths } from '@presentation/base/theme';
import type { PickSource } from '@presentation/base/utils/pick-source';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { t } from '@presentation/i18n';
import { isWeb } from '@infrastructure/constants/platform';
import type { FilePage } from '@presentation/app/import-recipe/model/file/file-page';
import { FileDropZone } from '@presentation/app/import-recipe/body/file/file-drop-zone';
import { FileSourceOptions } from '@presentation/app/import-recipe/body/file/file-source-options';
import { FilePageGrid } from '@presentation/app/import-recipe/body/file/file-page-grid';
import { FileReadButton } from '@presentation/app/import-recipe/items/file-read-button';

export interface FilePickerViewProps {
  pages: readonly FilePage[];
  pickFailure: Failure | null;
  isPdf: boolean;
  isFull: boolean;
  isDragging: boolean;
  onPick: (source: PickSource) => void;
  onAddPage: () => void;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const AI_MARK = [ProvenanceMark.Ai] as const;

/**
 * The picker step: what the feature takes, the pages picked so far, and
 * "Read recipe".
 *
 * @remarks
 * - **Empty looks different per platform** — the camera and the library on a
 *   phone, a drop zone and a file dialog in a browser.
 * - **The button stays at the bottom**, outside the scroll, so five tall page
 *   tiles never push it out of reach.
 */
export const FilePickerView = (props: FilePickerViewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const scrollable = useAssistantScrollable();
  const copy = t().fileImport;
  const { pages, pickFailure, onPick } = props;
  const isEmpty = pages.length === ValueConstants.zero;

  return (
    <>
      <ScrollView {...scrollable} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            onPress={props.onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel={t().common.cancel}
          >
            <Ionicons name="close" size={iconSizes.lg} color={colors.text} />
          </Pressable>
          <ThemedText variant="subtitle">{copy.title}</ThemedText>
        </View>

        <View style={[styles.lead, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <ProvenanceSeal marks={AI_MARK} surface={SealSurface.Page} size={provenanceSealMetrics.importLeadSize} />
          <ThemedText variant="body" style={styles.leadText}>
            {copy.lead}
          </ThemedText>
        </View>

        {pickFailure !== null ? (
          <FormBanner
            message={failureContent(pickFailure).body}
            severity={failureSeverity(pickFailure)}
            icon={failureIcon(pickFailure)}
          />
        ) : null}

        {!isEmpty ? (
          <FilePageGrid
            pages={pages}
            isPdf={props.isPdf}
            isFull={props.isFull}
            isDragging={props.isDragging}
            onSelect={props.onSelect}
            onRemove={props.onRemove}
            onAdd={props.onAddPage}
          />
        ) : isWeb() ? (
          <FileDropZone isDragging={props.isDragging} onChoose={props.onAddPage} />
        ) : (
          <FileSourceOptions onPick={onPick} />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <FileReadButton disabled={isEmpty} onPress={props.onSubmit} />
        <View style={styles.note}>
          <Ionicons name="lock-closed-outline" size={iconSizes.sm} color={colors.textMuted} />
          <ThemedText variant="caption" style={[styles.noteText, { color: colors.textMuted }]}>
            {copy.note}
          </ThemedText>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  closeBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  leadText: {
    flex: ValueConstants.one,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  noteText: {
    flexShrink: ValueConstants.one,
    textAlign: 'center',
  },
});
