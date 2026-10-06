import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, lineHeights, lineHeightFor, iconSizes, avatarSizes, borderWidths, opacities, colorAlphas } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { NotifKind } from '@presentation/app/notifications/model/notif-kind';
import { useKindMeta } from '@presentation/app/notifications/hooks/use-kind-meta';
import { CharConstants, ValueConstants } from '@core/constants';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { importSourceLine } from '@presentation/app/notifications/model/import-source-line';
import { CreatorHandleRules } from '@domain/creators/creator-handle-rules';
import { creatorPlatformName } from '@presentation/base/widgets/creators/creator-platform-name';

const actionText = (n: NotifItem): string => {
  const labels = t().notifications;
  switch (n.kind) {
    case NotifKind.Comment: return `${labels.commented} ${n.recipeName ?? CharConstants.empty}`;
    case NotifKind.Like: return `${labels.liked} ${n.recipeName ?? CharConstants.empty}`;
    case NotifKind.Favorite: return `${labels.saved} ${n.recipeName ?? CharConstants.empty}`;
    case NotifKind.AiDone: return labels.aiDoneLabel;
    case NotifKind.ImportDone: return labels.importDoneLabel;
    case NotifKind.ImportFailed: return labels.importFailedLabel;
    case NotifKind.ModerationApproved: return `${labels.modOk} ${n.recipeName ?? CharConstants.empty}`;
    case NotifKind.ModerationPending: return `${labels.modPending} ${n.recipeName ?? CharConstants.empty}`;
    case NotifKind.Follow: return labels.followed;
    case NotifKind.CreatorApproved: return creatorLine(labels.creatorApproved, n);
    case NotifKind.CreatorRejected: return creatorLine(labels.creatorRejected, n);
    // NEVER empty. An unknown type degrades to `generic`, and this used to
    // return '' for anything with no recipe behind it — which is how an
    // `import_done` the app did not know about rendered as a blank row.
    case NotifKind.Generic: return n.recipeName ?? labels.genericLabel;
  }
};

/** "verified your Instagram account" — the platform named; the handle goes on the line under it. */
const creatorLine = (template: string, n: NotifItem): string =>
  // A platform this build cannot name: the row still says something, never blank.
  n.creator === undefined ? t().notifications.genericLabel : template.replace('{platform}', creatorPlatformName(n.creator.platform));

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
  const sourceLine =
    item.source !== undefined
      ? importSourceLine(item.source)
      : item.creator !== undefined && item.creator.handle !== null
        ? `${CreatorHandleRules.Prefix}${item.creator.handle}`
        : undefined;

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
      accessibilityLabel={[item.actor, actionText(item), sourceLine].filter(Boolean).join(' ')}
      // A target-less unread row's only action is "mark read" — say so, since
      // the label alone gives assistive tech no cue what activating it does.
      accessibilityHint={
        item.target === null && !item.read ? t().notifications.markOneHint : undefined
      }
    >
      {item.source !== undefined ? (
        <View style={styles.seal}>
          <ProvenanceSeal marks={[item.source.platform]} surface={SealSurface.Page} size={avatarSizes.md} decorative />
        </View>
      ) : (
        <View style={[styles.iconCircle, { backgroundColor: meta.color + colorAlphas.wash }]}>
          <Ionicons name={meta.icon} size={iconSizes.xl} color={meta.color} />
        </View>
      )}
      <View style={styles.rowBody}>
        <ThemedText variant="body" style={styles.actionLine} numberOfLines={ValueConstants.two}>
          <ThemedText variant="body" style={{ fontWeight: fontWeights.bold }}>{item.actor}</ThemedText>
          {' '}{actionText(item)}
        </ThemedText>
        {sourceLine !== undefined ? (
          <ThemedText variant="caption" muted numberOfLines={ValueConstants.two} style={styles.bodyText}>
            {sourceLine}
          </ThemedText>
        ) : null}
        {item.body !== undefined ? (
          <ThemedText variant="caption" muted numberOfLines={ValueConstants.two} style={styles.bodyText}>
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
  seal: { flexShrink: ValueConstants.zero },
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
