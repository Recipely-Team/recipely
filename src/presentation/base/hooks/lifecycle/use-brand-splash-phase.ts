import { useEffect, useState } from 'react';
import { durations } from '@presentation/base/theme';
import { isWeb } from '@infrastructure/constants/platform';

/** Where the launch's brand splash is: covering the app, fading out, or gone (always gone on the web). */
export const BrandSplashPhase = {
  Covering: 'covering',
  Leaving: 'leaving',
  Gone: 'gone',
} as const;

type BrandSplashPhaseType = (typeof BrandSplashPhase)[keyof typeof BrandSplashPhase];

/**
 * Follows `SplashOverlay`'s fixed timeline from this hook's mount (the root layout's, at launch).
 *
 * @remarks
 * - **A clock, not a signal.** The splash runs a fixed `durations.brandSplash` + fade; reading the
 *   same tokens keeps the two in step without a store between them.
 */
export const useBrandSplashPhase = (): BrandSplashPhaseType => {
  const [phase, setPhase] = useState<BrandSplashPhaseType>(isWeb() ? BrandSplashPhase.Gone : BrandSplashPhase.Covering);

  useEffect(() => {
    if (isWeb()) return undefined;
    const leaving = setTimeout(() => setPhase(BrandSplashPhase.Leaving), durations.brandSplash);
    const gone = setTimeout(() => setPhase(BrandSplashPhase.Gone), durations.brandSplash + durations.brandSplashFade);
    return () => {
      clearTimeout(leaving);
      clearTimeout(gone);
    };
  }, []);

  return phase;
};
