/**
 * Presentation constants that are genuinely cross-cutting — read by more than
 * one feature and not a design measurement.
 *
 * WHAT DOES *NOT* BELONG HERE:
 * - Design measurements (spacing, radii, sizes, opacity, tracking, z-order)
 *   → `@presentation/base/theme`.
 * - A value only one page reads → that page's `model/` folder.
 * - A value only one shared widget reads → a sibling file next to the widget.
 * - Structural literals (`''`, `0`, separators, shared regexes) → `@core/constants`.
 * - API endpoints, limits and storage keys → `src/infrastructure/constants/`.
 *
 * The test is reuse, not type: a number is not "a constant" because it is a
 * number. If exactly one module reads it, it belongs next to that module.
 */
export { AnimationConstants } from './animation-constants';
export { RoutePaths } from './route-paths';
export { ListConstants } from './list-constants';
export { KeyboardKey } from './platform-events';
export { scrollThrottleMs } from './scroll-constants';
export { SiteMetadata } from '@presentation/base/constants/site-metadata';
