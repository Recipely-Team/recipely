import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { COMMENT_MAX_LENGTH } from '@presentation/app/recipes/[recipeId]/model/comments/comment-limits';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { SectionHeader } from '@presentation/base/widgets/text/section-header';
import { CommentCard } from '@presentation/app/recipes/[recipeId]/items/comment-card';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { spacing, radii, iconSizes, controlSizes, borderWidths, opacities } from '@presentation/base/theme';
import type { UseCommentHighlightResult } from '@presentation/app/recipes/[recipeId]/model/comments/use-comment-highlight-result';
import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';
import { ValueConstants } from '@core/constants';

export interface RecipeCommentsSectionProps {
  commentState: RecipeCommentsState | undefined;
  userId: string | null;
  commentInput: string;
  submitError: string | null;
  onChangeCommentInput: (value: string) => void;
  onFocusCommentInput: () => void;
  onAddComment: () => void;
  onLoadMoreComments: () => void;
  onToggleCommentLike: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  commentHighlight: UseCommentHighlightResult;
}

/**
 * Comments block for the mobile detail screen: header, list (with loading/empty
 * states), load-more, and the comment composer with its inline submit error.
 */
export const RecipeCommentsSection = ({
  commentState,
  userId,
  commentInput,
  submitError,
  onChangeCommentInput,
  onFocusCommentInput,
  onAddComment,
  onLoadMoreComments,
  onToggleCommentLike,
  onDeleteComment,
  commentHighlight,
}: RecipeCommentsSectionProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <>
      <SectionHeader
        title={
          commentState?.total
            ? `${t().comments.title} · ${commentState.total}`
            : t().comments.title
        }
      />

      {commentState?.isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.commentsLoader} />
      ) : !commentState || commentState.items.length === ValueConstants.zero ? (
        <ThemedText variant="caption" muted style={styles.commentsEmpty}>
          {t().comments.empty}
        </ThemedText>
      ) : (
        <View style={styles.commentsList}>
          {commentState.items.map((comment) => (
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

      {commentState !== undefined && commentState.items.length < commentState.total ? (
        <Pressable
          onPress={onLoadMoreComments}
          style={({ pressed }) => [
            styles.loadMoreBtn,
            { borderColor: colors.border, opacity: pressed ? opacities.pressedStrong : opacities.full },
          ]}
        >
          <ThemedText variant="caption" muted>
            {commentState.isLoadingMore ? t().common.loading : t().comments.loadMore}
          </ThemedText>
        </Pressable>
      ) : null}

      <View style={styles.commentInputRow}>
        <AutoGrowTextInput
          value={commentInput}
          onChangeText={onChangeCommentInput}
          placeholder={t().comments.placeholder}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.commentInput,
            { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
          ]}
          minHeight={controlSizes.searchBar}
          maxLength={COMMENT_MAX_LENGTH}
          onFocus={onFocusCommentInput}
        />
        <Pressable
          onPress={onAddComment}
          disabled={commentState?.isSubmitting === true || commentInput.trim().length === ValueConstants.zero}
          accessibilityRole="button"
          accessibilityLabel={t().comments.send}
          style={({ pressed }) => [
            styles.commentSendBtn,
            {
              backgroundColor: colors.primary,
              opacity:
                pressed || commentState?.isSubmitting === true || commentInput.trim().length === ValueConstants.zero
                  ? opacities.disabledFaint
                  : opacities.full,
            },
          ]}
        >
          <Ionicons name="send" size={iconSizes.md} color={colors.onOverlay} />
        </Pressable>
      </View>

      {submitError !== null ? (
        <ThemedText variant="caption" style={[styles.submitError, { color: colors.danger }]}>
          {submitError}
        </ThemedText>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  commentsLoader: {
    marginVertical: spacing.md,
  },
  commentsEmpty: {
    marginTop: spacing.sm,
  },
  commentsList: {
    gap: spacing.sm,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  commentInput: {
    flex: ValueConstants.one,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  commentSendBtn: {
    width: controlSizes.searchBar,
    height: controlSizes.searchBar,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitError: {
    marginTop: spacing.xs,
  },
});
