import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OwnerStatus } from '@domain/recipes/publishing/owner-status';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';
import { ownerStatusLook } from '@presentation/base/widgets/badges/owner-status-look';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { spacing, radii, iconSizes, fontWeights, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { useOwnerStatusPanel } from '@presentation/app/recipes/[recipeId]/hooks/use-owner-status-panel';
import { PanelConfirm } from '@presentation/app/recipes/[recipeId]/model/publishing/panel-confirm';
import { statusNote } from '@presentation/app/recipes/[recipeId]/model/publishing/status-note';
import { thingsLeftLabel } from '@presentation/app/recipes/[recipeId]/model/publishing/things-left-label';
import { PanelAction } from '@presentation/app/recipes/[recipeId]/items/publishing/panel-action';
import { PublishChecklist } from '@presentation/app/recipes/[recipeId]/items/publishing/publish-checklist';

export interface OwnerStatusPanelProps {
  recipe: RecipeEntity;
  /** The gallery's add-photo flow, reused by the checklist's "add your own photo". */
  onAddPhoto: () => void;
}

/**
 * The owner's view of where their recipe stands, under the author line: one
 * sentence per state and the action it allows.
 *
 * @remarks
 * - **Private** — Publish and Edit; a website import adds its checklist, and
 *   Publish stays disabled, saying how many things are left.
 * - **In review** — Make private. **Published** — Unpublish.
 * - **Rejected** — the reason in the error style and "it stays private"; no
 *   Publish again, because the backend refuses it.
 * - **Both publish and unpublish ask first**, in the shared `ConfirmSheet`; the
 *   publish question is the assistant's own copy, so it reads the same spoken.
 */
export const OwnerStatusPanel = ({ recipe, onAddPhoto }: OwnerStatusPanelProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const danger = useSeveritySurfaces().danger;
  const panel = useOwnerStatusPanel(recipe);
  const rejected = panel.status === OwnerStatus.Rejected;
  const isPrivate = panel.status === OwnerStatus.Private;
  const remaining = panel.blockers.length;
  const inReview = panel.status === OwnerStatus.InReview;

  return (
    <View
      style={[
        styles.panel,
        rejected
          ? { backgroundColor: danger.bg, borderColor: danger.border }
          : { backgroundColor: colors.surface, borderColor: colors.cardBorder },
      ]}
    >
      <View style={styles.header}>
        <Ionicons
          name={ownerStatusLook[panel.status].icon}
          size={iconSizes.md}
          color={rejected ? danger.icon : colors.primary}
        />
        <View style={styles.headerText}>
          <ThemedText variant="body" style={[styles.note, rejected ? { color: danger.text } : null]}>
            {statusNote[panel.status]()}
          </ThemedText>
          {rejected ? (
            <ThemedText variant="caption" muted>
              {t().publishing.rejectedNote}
            </ThemedText>
          ) : null}
        </View>
      </View>

      {isPrivate && remaining > ValueConstants.zero ? (
        <PublishChecklist
          blockers={panel.blockers}
          hasCover={panel.hasCover}
          isBusy={panel.isBusy}
          onAddPhoto={onAddPhoto}
          onRemoveCover={panel.onRemoveCover}
          onEdit={panel.onEdit}
        />
      ) : null}

      {isPrivate ? (
        <View style={styles.actions}>
          <PanelAction
            primary
            icon="globe-outline"
            label={remaining > ValueConstants.zero ? thingsLeftLabel(remaining) : t().publishing.publish}
            onPress={panel.onRequestPublish}
            disabled={!panel.canPublish || panel.isBusy}
          />
          <PanelAction icon="create-outline" label={t().publishing.edit} onPress={panel.onEdit} disabled={panel.isBusy} />
        </View>
      ) : null}
      {inReview || panel.status === OwnerStatus.Published ? (
        <View style={styles.actions}>
          <PanelAction
            icon={inReview ? 'lock-closed' : 'eye-off-outline'}
            label={inReview ? t().publishing.makePrivate : t().publishing.unpublish}
            onPress={panel.onRequestUnpublish}
            disabled={panel.isBusy}
          />
        </View>
      ) : null}

      <ConfirmSheet
        visible={panel.confirm === PanelConfirm.Publish}
        title={t().assistant.publishTitle}
        message={t().assistant.publishMessage}
        confirmLabel={t().assistant.publishConfirm}
        onConfirm={panel.onConfirm}
        onClose={panel.onCancelConfirm}
      />
      <ConfirmSheet
        visible={panel.confirm === PanelConfirm.Unpublish}
        title={inReview ? t().publishing.makePrivateTitle : t().publishing.unpublishTitle}
        message={inReview ? t().publishing.makePrivateMessage : t().publishing.unpublishMessage}
        confirmLabel={inReview ? t().publishing.makePrivate : t().publishing.unpublish}
        onConfirm={panel.onConfirm}
        onClose={panel.onCancelConfirm}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerText: {
    flex: ValueConstants.one,
    gap: spacing.xxs,
  },
  note: {
    fontWeight: fontWeights.semibold,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
