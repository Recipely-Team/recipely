import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PublishBlocker, type PublishBlockerType } from '@domain/recipes/publishing/publish-blocker';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, iconSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { blockerLook } from '@presentation/app/recipes/[recipeId]/model/publishing/blocker-look';
import { PanelAction } from '@presentation/app/recipes/[recipeId]/items/publishing/panel-action';

export interface PublishChecklistProps {
  blockers: readonly PublishBlockerType[];
  /** Whether there is still a site photo to take off. */
  hasCover: boolean;
  isBusy: boolean;
  onAddPhoto: () => void;
  onRemoveCover: () => void;
  onEdit: () => void;
}

/**
 * What a website import still needs before it can be published, one row per
 * missing thing with the action that fixes it.
 *
 * @remarks
 * - **Explained, not scolded.** The intro says how site recipes are shared,
 *   in muted text — nothing here is an error, it is the next step.
 */
export const PublishChecklist = ({
  blockers,
  hasCover,
  isBusy,
  onAddPhoto,
  onRemoveCover,
  onEdit,
}: PublishChecklistProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={styles.list}>
      <ThemedText variant="caption" muted>
        {t().publishing.checklistIntro}
      </ThemedText>
      {blockers.map((blocker) => (
        <View key={blocker} style={styles.row}>
          <View style={styles.rowLabel}>
            <Ionicons name={blockerLook[blocker].icon} size={iconSizes.md} color={colors.textMuted} />
            <ThemedText variant="body" style={styles.rowText}>
              {blockerLook[blocker].label()}
            </ThemedText>
          </View>
          <View style={styles.rowActions}>
            {blocker === PublishBlocker.Photo ? (
              <>
                <PanelAction icon="camera" label={t().publishing.addPhoto} onPress={onAddPhoto} disabled={isBusy} />
                {hasCover ? (
                  <PanelAction
                    icon="trash-outline"
                    label={t().publishing.removeSitePhoto}
                    onPress={onRemoveCover}
                    disabled={isBusy}
                  />
                ) : null}
              </>
            ) : (
              <PanelAction icon="create-outline" label={t().publishing.edit} onPress={onEdit} disabled={isBusy} />
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xs2,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowText: {
    flex: ValueConstants.one,
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
