import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';
import { hasKey } from '@core/guards/type-guards';

/** The handle a list hands back, named here so both callers describe the same thing. */
type ScrollHandleType = Parameters<AssistantScrollableProps['ref']>[0];

/**
 * Moves whichever kind of list is attached, and says whether it moved.
 *
 * @remarks
 * - **The return value is the point.** This used to be `void` and swallowed a
 *   null handle, so "aşağı kaydır" on a screen whose list was not mounted —
 *   the feed in its wide-layout, search-results and loading branches, where
 *   the ref was attached to none of them — reported success while nothing
 *   happened. An action that cannot fail cannot be trusted when it succeeds.
 * - **`FlatList` takes an offset, `ScrollView` a coordinate, and `SectionList`
 *   neither** — it hands out the scroll responder underneath instead. Asking
 *   for the method that exists is what lets one function serve all three.
 */
export const moveScrollTo = (handle: ScrollHandleType, y: number): boolean => {
  if (handle === null) return false;

  if (handle.scrollToOffset !== undefined) {
    handle.scrollToOffset({ offset: y, animated: true });
    return true;
  }
  if (handle.scrollTo !== undefined) {
    handle.scrollTo({ y, animated: true });
    return true;
  }

  const responder = handle.getScrollResponder?.();
  if (hasKey(responder, 'scrollTo') && typeof responder.scrollTo === 'function') {
    (responder.scrollTo as (options: { y: number; animated?: boolean }) => void)({ y, animated: true });
    return true;
  }
  return false;
};
