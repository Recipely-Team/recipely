import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { ScrollView, ScrollViewProps } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { spacing } from '@presentation/base/theme';
import type { CommentNode } from '@presentation/app/recipes/[recipeId]/model/comments/comment-node';
import type { UseCommentHighlightResult } from '@presentation/app/recipes/[recipeId]/model/comments/use-comment-highlight-result';
import { ValueConstants } from '@core/constants';

import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';

/** Inputs {@link useCommentHighlight} needs from the recipe-detail view model. */
interface UseCommentHighlightArgs {
  recipeId: string;
  commentState: RecipeCommentsState | undefined;
  scrollViewRef: RefObject<ScrollView | null>;
}

/**
 * Upper bound on `loadMore` calls while hunting for a deep-linked comment. The
 * loop is already self-terminating (it stops as soon as a page fails to grow
 * `items`), but a server that keeps returning growing-yet-never-matching pages
 * would otherwise page forever.
 */
const MAX_PAGE_FETCHES = 10;

/**
 * Upper bound on measure+scroll passes. Content settles in a handful of growth
 * events (hero image, gallery, ingredients); this only exists so a layout that
 * oscillates forever can't chase the user around the screen.
 */
const MAX_SCROLL_ATTEMPTS = 8;

/** Sub-pixel jitter between two measurements still counts as "stopped moving". */
const SETTLE_EPSILON_PX = 1;

/** Breathing room above the comment so it isn't jammed against the viewport edge. */
const SCROLL_OFFSET = spacing.xxl;

/**
 * Resolves the `?commentId=` deep link on the recipe-detail screen: pages the
 * comment list until the target comment is loaded, then scrolls it into view
 * and flashes it.
 *
 * @remarks
 * - **Re-measures on every content-size change**, not once on mount. Mount is
 *   not layout-settled: the hero image and ingredients above the card have no
 *   height yet, so the comment measures near y=0 — a one-shot scroll lands at
 *   the top of the page and the comment is then pushed ~1400px down as images
 *   load. `onContentSizeChange` is the reliable "layout moved" signal; the
 *   card's own `onLayout` is not, since its y relative to its parent doesn't
 *   change when an ancestor above it grows.
 * - **Stops** as soon as it's pointless (same y twice), spent
 *   (`MAX_SCROLL_ATTEMPTS`) or unwanted (the user scrolled — their position
 *   always wins over ours). The flash still fires exactly once.
 * - **Unanimated on purpose** — this scroll re-runs as the content above grows,
 *   and smooth scrolls each interrupt the last, visibly ping-ponging the user
 *   on the way down. An anchor jumps, it doesn't glide. It also sidesteps
 *   react-native-web routing `animated: true` through
 *   `node.scroll({ behavior: 'smooth' })`, which silently does nothing in
 *   browsers with smooth scrolling turned off.
 * - **The flash is independent of the scroll**, so a failed measure still
 *   highlights rather than jumping the user to an arbitrary offset.
 * - **Only ever calls `loadMore`**, and only while no other comment request is
 *   in flight; the initial load stays owned by `useRecipeDetail`.
 * - **A new deep link on a mounted screen** (tapping a notification for the
 *   recipe already on screen) must scroll and flash again, so the previous
 *   link's spent one-shots and budgets are retired.
 */
export const useCommentHighlight = ({
  recipeId,
  commentState,
  scrollViewRef,
}: UseCommentHighlightArgs): UseCommentHighlightResult => {
  const params = useLocalSearchParams<{ commentId?: string }>();
  const targetId = typeof params.commentId === 'string' && params.commentId.length > ValueConstants.zero
    ? params.commentId
    : null;

  const { commentsStore } = useStores();
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const nodeRef = useRef<CommentNode | null>(null);
  // Bumped when the target card mounts, so the scroll effect re-runs with a node.
  const [nodeVersion, setNodeVersion] = useState(ValueConstants.zero);
  const attemptsRef = useRef(ValueConstants.zero);
  const lastCountRef = useRef(-1);
  const flashedRef = useRef(false);
  const scrollDoneRef = useRef(false);
  const scrollAttemptsRef = useRef(ValueConstants.zero);
  const lastYRef = useRef<number | null>(null);

  const registerTargetNode = useCallback((node: CommentNode | null): void => {
    nodeRef.current = node;
    if (node !== null) setNodeVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    flashedRef.current = false;
    scrollDoneRef.current = false;
    scrollAttemptsRef.current = ValueConstants.zero;
    lastYRef.current = null;
    attemptsRef.current = ValueConstants.zero;
    lastCountRef.current = -1;
    setHighlightedCommentId(null);
  }, [targetId, recipeId]);

  // Paging: walk forward until the target lands in `items` or the walk is spent.
  useEffect(() => {
    if (targetId === null || recipeId.length === ValueConstants.zero) return;
    if (commentState === undefined) return;
    if (commentState.isLoading || commentState.isLoadingMore) return;
    if (commentState.items.some((c) => c.id === targetId)) return;
    if (commentState.items.length >= commentState.total) return;
    // A page that didn't grow the list means the server has nothing more for us.
    if (commentState.items.length <= lastCountRef.current) return;
    if (attemptsRef.current >= MAX_PAGE_FETCHES) return;
    lastCountRef.current = commentState.items.length;
    attemptsRef.current += 1;
    void commentsStore.getState().loadMore(recipeId);
  }, [targetId, recipeId, commentState, commentsStore]);

  /** The user took the scroller: never move it under them again for this link. */
  const releaseToUser = useCallback((): void => {
    scrollDoneRef.current = true;
  }, []);

  const scrollToTarget = useCallback((): void => {
    if (targetId === null || scrollDoneRef.current) return;
    const node = nodeRef.current;
    const scrollView = scrollViewRef.current;
    if (node === null || scrollView === null) return;
    const innerNode: unknown = scrollView.getInnerViewNode();
    if (innerNode === null || innerNode === undefined) return;
    if (scrollAttemptsRef.current >= MAX_SCROLL_ATTEMPTS) {
      scrollDoneRef.current = true;
      return;
    }
    scrollAttemptsRef.current += 1;

    node.measureLayout(
      innerNode as Parameters<CommentNode['measureLayout']>[0],
      (_x, y) => {
        // The user grabbed the scroller while we were measuring — their call.
        if (scrollDoneRef.current) return;
        const previousY = lastYRef.current;
        lastYRef.current = y;
        // The same y twice running means the content above the comment has
        // stopped growing: this landing is the final one.
        if (previousY !== null && Math.abs(y - previousY) <= SETTLE_EPSILON_PX) {
          scrollDoneRef.current = true;
        }
        scrollViewRef.current?.scrollTo({ y: Math.max(ValueConstants.zero, y - SCROLL_OFFSET), animated: false });
      },
      () => {
        // Card unmounted mid-measure: keep the highlight, skip the scroll.
      },
    );
  }, [targetId, scrollViewRef]);

  // The flash is deliberately independent of the scroll: it fires as soon as the
  // target card exists, whether or not we ever move the viewport. Tying it to a
  // successful measurement would let a user who touches the scroller during the
  // load (on native `onTouchMove` fires on incidental movement, not just a
  // deliberate drag) surrender the scroll and lose the highlight with it —
  // leaving the deep link doing nothing at all. Marking the comment costs them
  // nothing; only moving them under their finger would.
  useEffect(() => {
    if (targetId === null || flashedRef.current || nodeRef.current === null) return;
    flashedRef.current = true;
    setHighlightedCommentId(targetId);
  }, [targetId, nodeVersion]);

  // First pass, as soon as the target card hands over its node.
  useEffect(() => {
    scrollToTarget();
  }, [scrollToTarget, nodeVersion]);

  const scrollViewProps = useMemo<ScrollViewProps>(() => {
    // `onWheel` is a web-only DOM prop that RN's types don't declare and native
    // ignores. Spreading it in keeps the cast to this one prop, so the three
    // real ScrollView handlers below stay excess-property-checked — a typo like
    // `onContentSizeChanged` must not compile.
    const webOnly = { onWheel: releaseToUser } as Partial<ScrollViewProps>;
    return {
      onContentSizeChange: scrollToTarget,
      // Three handlers because no single one covers both shells: react-native-web
      // NEVER fires `onScrollBeginDrag` (its ScrollViewBase only forwards
      // onScroll/onTouchMove/onWheel to the DOM), so `onWheel` is the only
      // desktop-web signal that the user has taken over.
      onScrollBeginDrag: releaseToUser,
      onTouchMove: releaseToUser,
      ...webOnly,
    };
  }, [scrollToTarget, releaseToUser]);

  return { targetCommentId: targetId, highlightedCommentId, registerTargetNode, scrollViewProps };
};
