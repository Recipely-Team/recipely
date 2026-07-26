import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, avatarSizes, borderWidths, opacities } from '@presentation/base/theme';
import { formatTimeAgo } from '@presentation/base/utils/format-time-ago';
import { t } from '@presentation/i18n';
import type { CommentNode } from '@presentation/app/recipes/[recipeId]/model/comments/comment-node';
import { ValueConstants } from '@core/constants';
import { AnimationConstants } from '@presentation/base/constants';

export interface CommentCardProps {
  body: string;
  authorDisplayName: string;
  authorPhotoUrl: string | null;
  createdAt: Date;
  isOwn: boolean;
  likeCount: number;
  likedByMe: boolean;
  canLike: boolean;
  onToggleLike: () => void;
  onDelete?: () => void;
  /** When true the card flashes a primary tint once, then settles back. */
  highlighted?: boolean;
  /** Registers the card's root node so a deep link can scroll to it. */
  nodeRef?: (node: CommentNode | null) => void;
}

const AVATAR_SIZE = avatarSizes.sm;

const FLASH_IN_MS = 220;
const FLASH_HOLD_MS = 700;
const FLASH_OUT_MS = 900;

/** Displays a single recipe comment: author avatar, name, relative time, body, and an owner-only delete button. */
export const CommentCard = ({
  body,
  authorDisplayName,
  authorPhotoUrl,
  createdAt,
  isOwn,
  likeCount,
  likedByMe,
  canLike,
  onToggleLike,
  onDelete,
  highlighted = false,
  nodeRef,
}: CommentCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const flash = useSharedValue(ValueConstants.zero);

  useEffect(() => {
    if (!highlighted) return;
    flash.value = withSequence(
      withTiming(1, { duration: FLASH_IN_MS }),
      withDelay(FLASH_HOLD_MS, withTiming(ValueConstants.zero, { duration: FLASH_OUT_MS })),
    );
  }, [highlighted, flash]);

  // At rest (flash = 0) this resolves to exactly the normal card colors, so a
  // non-highlighted card is visually unchanged.
  const flashStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      flash.value,
      AnimationConstants.progressRange,
      [colors.cardBackground, colors.primaryLight],
    ),
    borderColor: interpolateColor(
      flash.value,
      AnimationConstants.progressRange,
      [colors.cardBorder, colors.primary],
    ),
  }));

  return (
    <Animated.View ref={nodeRef} style={[styles.card, flashStyle]}>
      <View style={styles.headerRow}>
        <AvatarImage
          uri={authorPhotoUrl ?? undefined}
          name={authorDisplayName}
          size={AVATAR_SIZE}
        />
        <View style={styles.headerText}>
          <ThemedText variant="body" style={styles.author} numberOfLines={1}>
            {authorDisplayName}
          </ThemedText>
          <ThemedText variant="caption" muted>
            {formatTimeAgo(createdAt)}
          </ThemedText>
        </View>
        {isOwn ? (
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={t().comments.delete}
            hitSlop={spacing.sm}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={iconSizes.md} color={colors.danger} />
          </Pressable>
        ) : null}
      </View>
      <ThemedText variant="body" style={styles.bodyText}>
        {body}
      </ThemedText>
      <View style={styles.footerRow}>
        <Pressable
          onPress={onToggleLike}
          disabled={!canLike}
          accessibilityRole="button"
          accessibilityLabel={likedByMe ? t().comments.unlike : t().comments.like}
          hitSlop={spacing.sm}
          style={[styles.likeBtn, { opacity: canLike ? opacities.full : opacities.disabled }]}
        >
          <Ionicons
            name={likedByMe ? 'heart' : 'heart-outline'}
            size={iconSizes.md}
            color={likedByMe ? colors.likeActive : colors.textMuted}
          />
          <ThemedText variant="caption" muted>
            {likeCount}
          </ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    flex: ValueConstants.one,
  },
  author: {
    fontWeight: fontWeights.semibold,
  },
  bodyText: {
    marginLeft: AVATAR_SIZE + spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: AVATAR_SIZE + spacing.sm,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  deleteBtn: {
    padding: spacing.xxs,
  },
});
