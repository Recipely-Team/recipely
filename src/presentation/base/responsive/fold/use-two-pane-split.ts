import { useMemo } from 'react';
import { ValueConstants } from '@core/constants';
import { FoldOrientation } from '@domain/display/fold-orientation';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { OrientationType } from '@presentation/base/responsive/orientation-type';
import { splitAtHinge } from '@presentation/base/responsive/fold/split-at-hinge';
import type { TwoPaneSplit } from '@presentation/base/responsive/fold/two-pane-split';

const NO_HINGE_STYLES = { rowStyle: null, firstPaneStyle: null } as const;

/**
 * Decides whether a hero | card screen splits, and where.
 *
 * @remarks
 * - **Without a hinge nothing changes**: a wide landscape window splits into two
 *   equal flex panes, everything else stacks.
 * - **A separating vertical hinge always splits, exactly at the hinge** — the
 *   first pane takes the left segment, the row's gap is the hinge, the second
 *   pane (`flex: 1`) takes the right segment. That holds on a half-opened Pixel
 *   Fold too, whose 840 dp falls short of the wide breakpoint: a stacked column
 *   would run straight across the fold.
 * - **A horizontal hinge (tabletop) keeps the current layout.** Splitting top
 *   and bottom would put a hero on the upper half and a keyboard-bound form on
 *   the lower one — a redesign, not a fix.
 * - **The row must span the window from its left edge**, as every caller's root
 *   does; the pane widths are window coordinates.
 */
export const useTwoPaneSplit = (): TwoPaneSplit => {
  const { width, height, isExpanded, orientation, fold } = useLayout();

  return useMemo<TwoPaneSplit>(() => {
    const panes = fold?.orientation === FoldOrientation.Vertical ? splitAtHinge(width, height, fold) : null;
    if (panes === null) {
      return { isSplit: isExpanded && orientation === OrientationType.Landscape, ...NO_HINGE_STYLES };
    }
    return {
      isSplit: true,
      rowStyle: { columnGap: panes.second.x - panes.first.width },
      firstPaneStyle: {
        flexGrow: ValueConstants.zero,
        flexShrink: ValueConstants.zero,
        flexBasis: panes.first.width,
      },
    };
  }, [width, height, isExpanded, orientation, fold]);
};
