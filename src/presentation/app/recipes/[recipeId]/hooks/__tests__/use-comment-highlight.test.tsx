/**
 * Unit tests for `useCommentHighlight` — the two loops that must never run away.
 *
 * 1. Paging: a comment notification deep-links to a comment that may sit on page
 *    4, so the hook pages forward until it finds it; a server that never returns
 *    the target must not page forever. Brakes: found, exhausted, capped.
 * 2. Scroll settling: mount is NOT layout-settled, so the hook re-measures on
 *    every content-size change. It must stop chasing once the y stops moving,
 *    once the attempts are spent, and — above all — the moment the user scrolls.
 *
 * react-test-renderer has no layout engine, so the scroll half is driven with a
 * fake node whose `measureLayout` replays a scripted list of y values (mimicking
 * a hero image loading in and shoving the comment down the page) and a fake
 * ScrollView recording `scrollTo`. That fakes the measurement, not the logic
 * under test: the settle/abort decisions are all the hook's.
 *
 * Harness: the hook is driven through a probe component (the repo has no
 * `renderHook`), same pattern as `use-auth-guard.test.tsx`.
 */

import type { RecipeCommentsState } from "@application/comments/list/recipe-comments-state";
import { CommentEntity } from "@domain/comments/comment-entity";
import { useCommentHighlight } from "@presentation/app/recipes/[recipeId]/hooks/use-comment-highlight";
import type { CommentNode } from "@presentation/app/recipes/[recipeId]/model/comments/comment-node";
import type { UseCommentHighlightResult } from "@presentation/app/recipes/[recipeId]/model/comments/use-comment-highlight-result";
import { renderComponent } from "@presentation/base/test-support/render-component";
import { spacing } from "@presentation/base/theme";
import { useState } from "react";
import type { ScrollView } from "react-native";
import { act } from "react-test-renderer";

const RECIPE_ID = "r-1";

/**
 * The gap the hook leaves above the comment. Imported rather than hard-coded so
 * a theme change can't quietly invalidate every scroll assertion below.
 */
const SCROLL_OFFSET = spacing.xxl;

let mockCommentId: string | undefined;
const mockLoadMore = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({ commentId: mockCommentId })),
}));

jest.mock("@presentation/bootstrap/use-stores", () => ({
  useStores: jest.fn(() => ({
    commentsStore: { getState: () => ({ loadMore: mockLoadMore }) },
  })),
}));

const makeComment = (id: string): CommentEntity => {
  const result = CommentEntity.create({
    id,
    body: "Looks great",
    authorId: "u-1",
    recipeId: RECIPE_ID,
    createdAt: new Date("2026-07-01T10:00:00.000Z"),
    authorDisplayName: "Ada",
    authorPhotoUrl: null,
    likeCount: 0,
    likedByMe: false,
  });
  if (!result.ok) throw new Error("Test setup expected a valid Comment");
  return result.value;
};

const makeState = (
  overrides: Partial<RecipeCommentsState> = {},
): RecipeCommentsState => ({
  items: [],
  total: 0,
  page: 1,
  isLoading: false,
  isLoadingMore: false,
  isSubmitting: false,
  error: null,
  ...overrides,
});

/** A page of `count` comments whose ids never match the deep-linked target. */
const decoyItems = (count: number): CommentEntity[] =>
  Array.from({ length: count }, (_, i) => makeComment(`c-decoy-${String(i)}`));

/** Stands in for the ScrollView's inner content node; only identity matters. */
const INNER_NODE = {};

interface ScrollFakes {
  scrollTo: jest.Mock;
  node: CommentNode;
  scrollViewRef: { current: ScrollView | null };
}

/**
 * A fake ScrollView + comment node whose `measureLayout` replays `ys` — one
 * value per measure pass, the last value repeating. `[2.5, 1400]` reproduces the
 * real bug: the card measures near the top on mount, then the hero image loads
 * and shoves it down.
 *
 * `as unknown as` is the established shape for test doubles in this repo
 * (see comments-store.test.ts) — a real ScrollView/host node can't be built here.
 */
const makeScrollFakes = (ys: number[]): ScrollFakes => {
  const scrollTo = jest.fn();
  const scrollViewRef = {
    current: {
      getInnerViewNode: () => INNER_NODE,
      scrollTo,
    } as unknown as ScrollView,
  };

  let pass = 0;
  const node = {
    measureLayout: (
      _inner: unknown,
      onSuccess: (x: number, y: number, width: number, height: number) => void,
    ): void => {
      const y = ys[Math.min(pass, ys.length - 1)] ?? 0;
      pass++;
      onSuccess(0, y, 0, 0);
    },
  } as unknown as CommentNode;

  return { scrollTo, node, scrollViewRef };
};

/** The y values handed to `scrollTo`, in order. */
const scrolledYs = (scrollTo: jest.Mock): unknown[] =>
  scrollTo.mock.calls.map((call) => (call[0] as { y: number }).y);

interface Harness {
  latest: () => UseCommentHighlightResult;
  push: (state: RecipeCommentsState | undefined) => void;
  register: (node: CommentNode) => void;
  growContent: () => void;
  userScroll: (via: "onWheel" | "onTouchMove" | "onScrollBeginDrag") => void;
}

/**
 * Renders the hook in a probe that owns `commentState` as local state, so
 * `push` re-renders the SAME mounted probe — the hook's paging guards live in
 * refs, and a remount would silently reset them (and hide a runaway loop).
 */
const driveHook = (
  initial: RecipeCommentsState | undefined,
  fakes?: ScrollFakes,
): Harness => {
  let latest: UseCommentHighlightResult = {
    targetCommentId: null,
    highlightedCommentId: null,
    registerTargetNode: () => undefined,
    scrollViewProps: {},
  };
  let setState!: (state: RecipeCommentsState | undefined) => void;

  const Probe = (): null => {
    const [state, setter] = useState<RecipeCommentsState | undefined>(initial);
    setState = setter;
    latest = useCommentHighlight({
      recipeId: RECIPE_ID,
      commentState: state,
      scrollViewRef: fakes?.scrollViewRef ?? { current: null },
    });
    return null;
  };

  renderComponent(<Probe />);

  return {
    latest: () => latest,
    push: (state) => {
      act(() => {
        setState(state);
      });
    },
    register: (node) => {
      act(() => {
        latest.registerTargetNode(node);
      });
    },
    growContent: () => {
      act(() => {
        latest.scrollViewProps.onContentSizeChange?.(0, 0);
      });
    },
    userScroll: (via) => {
      act(() => {
        // `onWheel` is web-only and absent from RN's ScrollViewProps type, so
        // reading the handlers back needs the same widening the hook uses.
        const handlers = latest.scrollViewProps as Record<
          string,
          (() => void) | undefined
        >;
        handlers[via]?.();
      });
    },
  };
};

beforeEach(() => {
  mockLoadMore.mockClear();
  mockCommentId = undefined;
});

describe("useCommentHighlight", () => {
  it("does nothing without a commentId deep link", () => {
    const harness = driveHook(makeState({ items: decoyItems(2), total: 10 }));

    expect(harness.latest().targetCommentId).toBeNull();
    expect(mockLoadMore).not.toHaveBeenCalled();
  });

  it("exposes the deep-linked id as the target so the card can register its node", () => {
    mockCommentId = "c-target";
    const harness = driveHook(
      makeState({ items: [makeComment("c-target")], total: 1 }),
    );

    expect(harness.latest().targetCommentId).toBe("c-target");
  });

  it("does not page when the target is already loaded", () => {
    mockCommentId = "c-target";
    driveHook(makeState({ items: [makeComment("c-target")], total: 50 }));

    expect(mockLoadMore).not.toHaveBeenCalled();
  });

  it("pages forward while the target is missing and more comments exist", () => {
    mockCommentId = "c-target";
    const harness = driveHook(makeState({ items: decoyItems(2), total: 6 }));

    expect(mockLoadMore).toHaveBeenCalledTimes(1);
    expect(mockLoadMore).toHaveBeenCalledWith(RECIPE_ID);

    harness.push(makeState({ items: decoyItems(4), total: 6 }));

    expect(mockLoadMore).toHaveBeenCalledTimes(2);
  });

  it("stops paging as soon as the target arrives", () => {
    mockCommentId = "c-target";
    const harness = driveHook(makeState({ items: decoyItems(2), total: 6 }));
    expect(mockLoadMore).toHaveBeenCalledTimes(1);

    harness.push(
      makeState({
        items: [...decoyItems(2), makeComment("c-target")],
        total: 6,
      }),
    );

    expect(mockLoadMore).toHaveBeenCalledTimes(1);
  });

  it("never pages past the last page", () => {
    mockCommentId = "c-target";
    driveHook(makeState({ items: decoyItems(6), total: 6 }));

    expect(mockLoadMore).not.toHaveBeenCalled();
  });

  it("does not stack requests while a page is already in flight", () => {
    mockCommentId = "c-target";
    driveHook(
      makeState({ items: decoyItems(2), total: 6, isLoadingMore: true }),
    );

    expect(mockLoadMore).not.toHaveBeenCalled();
  });

  it("waits for the initial load rather than racing it", () => {
    mockCommentId = "c-target";
    driveHook(makeState({ items: [], total: 6, isLoading: true }));

    expect(mockLoadMore).not.toHaveBeenCalled();
  });

  it("gives up when a page comes back without growing the list", () => {
    mockCommentId = "c-target";
    const harness = driveHook(makeState({ items: decoyItems(2), total: 6 }));
    expect(mockLoadMore).toHaveBeenCalledTimes(1);

    // The server claims 6 total but keeps handing back the same 2 comments.
    harness.push(makeState({ items: decoyItems(2), total: 6 }));
    harness.push(makeState({ items: decoyItems(2), total: 6 }));

    expect(mockLoadMore).toHaveBeenCalledTimes(1);
  });

  it("caps paging at MAX_PAGE_FETCHES when a growing list never yields the target", () => {
    mockCommentId = "c-target";
    // `total` always stays ahead of `items`, so only the cap can end this walk.
    const harness = driveHook(makeState({ items: decoyItems(1), total: 1000 }));

    for (let size = 2; size <= 30; size++) {
      harness.push(makeState({ items: decoyItems(size), total: 1000 }));
    }

    expect(mockLoadMore).toHaveBeenCalledTimes(10);
  });
});

describe("useCommentHighlight scroll settling", () => {
  const loaded = (): RecipeCommentsState =>
    makeState({ items: [makeComment("c-target")], total: 1 });

  it("re-measures as the content grows instead of trusting the mount-time y", () => {
    // The regression: the card mounts at y=2.5 (hero image has no height yet),
    // then images load and it ends up at y=1400. A mount-only scroll lands at 0.
    mockCommentId = "c-target";
    const fakes = makeScrollFakes([2.5, 1400]);
    const harness = driveHook(loaded(), fakes);

    harness.register(fakes.node);
    expect(scrolledYs(fakes.scrollTo)).toEqual([0]);

    harness.growContent();

    expect(scrolledYs(fakes.scrollTo)).toEqual([0, 1400 - SCROLL_OFFSET]);
  });

  it("stops re-scrolling once the measured y comes back the same twice", () => {
    mockCommentId = "c-target";
    const fakes = makeScrollFakes([1400]);
    const harness = driveHook(loaded(), fakes);

    harness.register(fakes.node);
    harness.growContent();
    expect(fakes.scrollTo).toHaveBeenCalledTimes(2);

    // Layout has settled; further content events must not move the scroller.
    harness.growContent();
    harness.growContent();

    expect(fakes.scrollTo).toHaveBeenCalledTimes(2);
  });

  it.each(["onWheel", "onTouchMove", "onScrollBeginDrag"] as const)(
    "hands the scroller back to the user on %s and never yanks it again",
    (via) => {
      // onWheel/onTouchMove are the ONLY signals on the web shell — react-native-web
      // never fires onScrollBeginDrag. All three must abort the chase.
      mockCommentId = "c-target";
      const fakes = makeScrollFakes([2.5, 1400, 1400]);
      const harness = driveHook(loaded(), fakes);

      harness.register(fakes.node);
      expect(fakes.scrollTo).toHaveBeenCalledTimes(1);

      harness.userScroll(via);
      harness.growContent();
      harness.growContent();

      expect(fakes.scrollTo).toHaveBeenCalledTimes(1);
    },
  );

  it("caps the chase when the layout never stops moving", () => {
    mockCommentId = "c-target";
    // Every measure returns a new y, so only MAX_SCROLL_ATTEMPTS can end this.
    const fakes = makeScrollFakes(
      Array.from({ length: 40 }, (_, i) => (i + 1) * 100),
    );
    const harness = driveHook(loaded(), fakes);

    harness.register(fakes.node);
    for (let i = 0; i < 30; i++) harness.growContent();

    expect(fakes.scrollTo).toHaveBeenCalledTimes(8);
  });

  // The flash is independent of the scroll. On native `onTouchMove` fires on
  // incidental finger movement during the load, not just a deliberate drag —
  // tying the flash to a successful measurement made that surrender the
  // highlight too, so the deep link silently did nothing at all.
  it("still flashes the comment when the user takes the scroller before any measurement", () => {
    mockCommentId = "c-target";
    const fakes = makeScrollFakes([1400]);
    const harness = driveHook(loaded(), fakes);

    harness.userScroll("onTouchMove");
    harness.register(fakes.node);

    expect(fakes.scrollTo).not.toHaveBeenCalled();
    expect(harness.latest().highlightedCommentId).toBe("c-target");
  });

  it("flashes once, as soon as the target card exists, even though the scroll re-runs", () => {
    mockCommentId = "c-target";
    const fakes = makeScrollFakes([2.5, 900, 1400]);
    const harness = driveHook(loaded(), fakes);

    expect(harness.latest().highlightedCommentId).toBeNull();

    harness.register(fakes.node);
    expect(harness.latest().highlightedCommentId).toBe("c-target");

    harness.growContent();
    harness.growContent();

    expect(harness.latest().highlightedCommentId).toBe("c-target");
  });

  it("never touches the scroller without a deep link", () => {
    const fakes = makeScrollFakes([1400]);
    const harness = driveHook(loaded(), fakes);

    harness.register(fakes.node);
    harness.growContent();

    expect(fakes.scrollTo).not.toHaveBeenCalled();
    expect(harness.latest().highlightedCommentId).toBeNull();
  });
});
