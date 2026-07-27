import { layoutSizes } from '@presentation/base/theme';

/**
 * How far the collapsing home band must travel to be off screen entirely.
 *
 * The band is absolutely positioned at `insets.top`, so its own height is not
 * the whole distance: moving it by `homeHeaderMax` alone leaves the bottom
 * `insets.top` of it — the search field — parked in the status-bar strip,
 * half-visible behind the clock. The inset has to travel with it.
 */
export const hiddenHeaderOffset = (insetTop: number): number =>
  -(layoutSizes.homeHeaderMax + insetTop);
