import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, lineHeights, lineHeightFor, iconSizes, avatarSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { useKindMeta } from '@presentation/app/notifications/hooks/use-kind-meta';
import { CharConstants, ValueConstants } from '@core/constants';

const actionText = (n: NotifItem): string => {
  const labels = t().notifications;
  switch (n.kind) {
    case 'comment': return `${labels.commented} ${n.recipeName ?? CharConstants.empty}`;
    case 'like': return `${labels.liked} ${n.recipeName ?? CharConstants.empty}`;
    case 'favorite': return `${labels.saved} ${n.recipeName ?? CharConstants.empty}`;
    case 'ai_done': return labels.aiDoneLabel;
    case 'moderation_approved': return `${labels.modOk} ${n.recipeName ?? CharConstants.empty}`;
    case 'moderation_pending': return `${labels.modPending} ${n.recipeName ?? CharConstants.empty}`;
    case 'follow': return labels.followed;
    case 'generic': return n.recipeName ?? CharConstants.empty;
  }
};

interface NotifRowProps {
  item: NotifItem;
  onTap: (item: NotifItem) => void;
}

const PRESSED_OPACITY = opacities.pressedLight;

/**
 * One notification row. Tapping marks the notification read and, when it has a
 * target, navigates to it. A read row whose `item.target` is null (e.g. a
 * follow — there is no public user-profile route) has nothing left to do: it
 * renders disabled, with no press feedback, and announces as text rather than
 * a button so assistive tech never offers an action that does nothing.
 */
export const NotifRow = ({ item, onTap }: NotifRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const meta = useKindMeta(item.kind);
  const tappable = item.target !== null || !item.read;

  return (
    <Pressable
      onPress={tappable ? () => onTap(item) : undefined}
      disabled={!tappable}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: item.read ? colors.cardBackground : colors.chipBackground,
          borderLeftWidth: item.read ? ValueConstants.zero : borderWidths.thick,
          borderLeftColor: colors.primary,
          opacity: pressed && tappable ? PRESSED_OPACITY : opacities.full,
        },
      ]}
      accessibilityRole={tappable ? 'button' : 'text'}
      accessibilityLabel={`${item.actor} ${actionText(item)}`}
      // A target-less unread row's only action is "mark read" — say so, since
      // the label alone gives assistive tech no cue what activating it does.
      accessibilityHint={
        item.target === null && !item.read ? t().notifications.markOneHint : undefined
      }
    >
      <View style={[styles.iconCircle, { backgroundColor: meta.color + '20' }]}>
        <Ionicons name={meta.icon} size={iconSizes.xl} color={meta.color} />
      </View>
      <View style={styles.rowBody}>
        <ThemedText variant="body" style={styles.actionLine} numberOfLines={2}>
          <ThemedText variant="body" style={{ fontWeight: fontWeights.bold }}>{item.actor}</ThemedText>
          {' '}{actionText(item)}
        </ThemedText>
        {item.body !== undefined ? (
          <ThemedText variant="caption" muted numberOfLines={2} style={styles.bodyText}>
            {item.body}
          </ThemedText>
        ) : null}
        <ThemedText variant="caption" muted style={styles.timestamp}>
          {item.daysAgo === ValueConstants.zero
            ? t().notifications.today
            : t().notifications.daysShort.replace('{n}', String(item.daysAgo))}
        </ThemedText>
      </View>
      {!item.read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconCircle: {
    width: avatarSizes.md,
    height: avatarSizes.md,
    borderRadius: avatarSizes.md / ValueConstants.two,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: ValueConstants.zero,
  },
  rowBody: { flex: ValueConstants.one, gap: spacing.xxs },
  actionLine: { fontSize: fontSizes.body, lineHeight: lineHeightFor(fontSizes.body, lineHeights.snug) },
  bodyText: { lineHeight: lineHeightFor(fontSizes.caption) },
  timestamp: { fontSize: fontSizes.small },
  unreadDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radii.xs,
    marginTop: spacing.sm,
    flexShrink: ValueConstants.zero,
  },
});
