import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { COMMENT_MAX_LENGTH } from '@presentation/app/recipes/[recipeId]/model/comments/comment-limits';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { CommentCard } from '@presentation/app/recipes/[recipeId]/items/comment-card';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, iconSizes, controlSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { UseCommentHighlightResult } from '@presentation/app/recipes/[recipeId]/model/comments/use-comment-highlight-result';
import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';
import { ValueConstants } from '@core/constants';

export interface WebRecipeDetailCommentsProps {
  commentState: RecipeCommentsState | undefined;
  userId: string | null;
  commentInput: string;
  submitError: string | null;
  onChangeCommentInput: (value: string) => void;
  onAddComment: () => void;
  onLoadMore: () => void;
  onToggleCommentLike: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  commentHighlight: UseCommentHighlightResult;
}

/**
 * Comments section for the web recipe detail: h2 header, input, list, and
 * load-more. Reuses the parent's handlers/state. The input row and like
 * button are always shown/enabled — a guest's tap is caught by
 * `onAddComment` / `onToggleCommentLike` (wired to `useGuestGate` in the
 * parent screen), which opens a sign-in prompt instead of running the action.
 */
export const WebRecipeDetailComments = ({
  commentState,
  userId,
  commentInput,
  submitError,
  onChangeCommentInput,
  onAddComment,
  onLoadMore,
  onToggleCommentLike,
  onDeleteComment,
  commentHighlight,
}: WebRecipeDetailCommentsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const total = commentState?.total ?? ValueConstants.zero;
  const items = commentState?.items ?? [];
  const canLoadMore = commentState !== undefined && items.length < commentState.total;
  const submitDisabled = commentState?.isSubmitting === true || commentInput.trim().length === ValueConstants.zero;

  return (
    <View style={styles.section}>
      <ThemedText style={[styles.heading, { color: colors.text }]}>
        {total > ValueConstants.zero ? `${t().comments.title} · ${String(total)}` : t().comments.title}
      </ThemedText>

      <View style={styles.inputRow}>
        <AutoGrowTextInput
          value={commentInput}
          onChangeText={onChangeCommentInput}
          placeholder={t().comments.placeholder}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
          ]}
          minHeight={controlSizes.searchBar}
          maxLength={COMMENT_MAX_LENGTH}
        />
        <Pressable
          onPress={onAddComment}
          disabled={submitDisabled}
          accessibilityRole="button"
          accessibilityLabel={t().comments.send}
          style={({ pressed }) => [
            styles.sendBtn,
            { backgroundColor: colors.primary, opacity: pressed || submitDisabled ? opacities.disabledFaint : opacities.full },
          ]}
        >
          <Ionicons name="send" size={iconSizes.md} color={colors.onOverlay} />
        </Pressable>
      </View>

      {submitError !== null ? (
        <ThemedText variant="caption" style={[styles.error, { color: colors.danger }]}>
          {submitError}
        </ThemedText>
      ) : null}

      {commentState?.isLoading === true ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : items.length === ValueConstants.zero ? (
        <ThemedText variant="caption" muted style={styles.empty}>
          {t().comments.empty}
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {items.map((comment) => (
            <CommentCard
              key={comment.id}
              body={comment.body}
              authorDisplayName={comment.authorDisplayName}
              authorPhotoUrl={comment.authorPhotoUrl}
              createdAt={comment.createdAt}
              isOwn={comment.authorId === userId}
              likeCount={comment.likeCount}
              likedByMe={comment.likedByMe}
              canLike
              onToggleLike={() => onToggleCommentLike(comment.id)}
              onDelete={() => onDeleteComment(comment.id)}
              highlighted={comment.id === commentHighlight.highlightedCommentId}
              nodeRef={
                comment.id === commentHighlight.targetCommentId
                  ? commentHighlight.registerTargetNode
                  : undefined
              }
            />
          ))}
        </View>
      )}

      {canLoadMore ? (
        <Pressable
          onPress={onLoadMore}
          accessibilityRole="button"
          accessibilityLabel={t().comments.loadMore}
          style={({ pressed }) => [
            styles.loadMore,
            { borderColor: colors.border, opacity: pressed ? opacities.pressedStrong : opacities.full },
          ]}
        >
          <ThemedText variant="caption" muted>
            {commentState?.isLoadingMore === true ? t().common.loading : t().comments.loadMore}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  heading: {
    fontSize: fontSizes.subheading,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.tight,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: ValueConstants.one,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendBtn: {
    width: controlSizes.searchBar,
    height: controlSizes.searchBar,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {},
  loader: {
    marginVertical: spacing.md,
  },
  empty: {},
  list: {
    gap: spacing.sm,
  },
  loadMore: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
});
