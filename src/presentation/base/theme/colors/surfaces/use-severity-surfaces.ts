import { useMemo } from 'react';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { errorSurfaces } from '@presentation/base/theme/colors/surfaces/error-surfaces';
import type { SeveritySurfaces } from '@presentation/base/theme/colors/surfaces/severity-surfaces';

/**
 * Resolves the severity surface palette (danger / warning / success / neutral)
 * for the active theme variant. Memoized on `scheme` + `colors` so feedback
 * components re-render only when the theme actually changes.
 */
export const useSeveritySurfaces = (): SeveritySurfaces => {
  const { scheme, colors } = useTheme();
  return useMemo(() => errorSurfaces(scheme, colors), [scheme, colors]);
};
