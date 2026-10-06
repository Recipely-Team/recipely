import type { CSSProperties } from 'react';
import { durations } from '@presentation/base/theme';
import { TimeConstants } from '@core/constants';

const KEYFRAMES_ID = 'recipely-shimmer';
const KEYFRAMES = `@keyframes ${KEYFRAMES_ID}{0%{background-position:200% 0}100%{background-position:-200% 0}}`;

/**
 * The web skeleton's CSS shimmer — one definition for both `SkeletonLoader`
 * builds, timed by the same `durations.shimmer` the native sweep uses.
 *
 * @remarks
 * - **`ensureKeyframes`** injects the keyframes into the document head once;
 *   a no-op outside a browser (SSR export).
 * - **`style`** is the gradient sweep for one placeholder block.
 */
export const WebShimmer = {
  ensureKeyframes: (): void => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(KEYFRAMES_ID)) return;
    const style = document.createElement('style');
    style.id = KEYFRAMES_ID;
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
  },
  style: (base: string, highlight: string): CSSProperties => ({
    background: `linear-gradient(90deg, ${base} 25%, ${highlight} 50%, ${base} 75%)`,
    backgroundSize: '200% 100%',
    animation: `${KEYFRAMES_ID} ${String(durations.shimmer / TimeConstants.millisecondsPerSecond)}s linear infinite`,
  }),
};
