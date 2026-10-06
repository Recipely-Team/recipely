import type { ThemeIdType } from '@presentation/base/theme/context/theme-id';

/**
 * Theme applied to a fresh install and used as the fallback when a persisted
 * `theme_id` no longer exists in the palette (e.g. after trimming the list of
 * selectable themes) — see `theme-context.tsx`.
 */
export const DEFAULT_THEME_ID: ThemeIdType = 'pearl-white';
