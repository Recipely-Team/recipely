import type { ScrollViewProps } from 'react-native';
import type { CommentNode } from '@presentation/app/recipes/[recipeId]/model/comments/comment-node';

/** View state returned by {@link useCommentHighlight} for the comment sections. */
export interface UseCommentHighlightResult {
  /**
   * Id of the deep-linked comment being resolved, or `null` when the screen was
   * not opened from a comment notification. Drives node registration — it is
   * known before the card is laid out.
   */
  targetCommentId: string | null;
  /**
   * Id of the comment to flash. Set only once the target card is actually laid
   * out and scrolled to, so the flash never plays off-screen.
   */
  highlightedCommentId: string | null;
  /** Ref callback the target `CommentCard` registers its root node with. */
  registerTargetNode: (node: CommentNode | null) => void;
  /**
   * Spread onto the detail `ScrollView`. Carries the content-size listener that
   * re-measures the target as the page grows, plus the user-took-over listeners
   * that stop the chase. Don't set these props on the ScrollView separately —
   * the spread would silently drop one.
   */
  scrollViewProps: ScrollViewProps;
}
