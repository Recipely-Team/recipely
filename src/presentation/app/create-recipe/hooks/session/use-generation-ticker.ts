import { useEffect, useState } from 'react';
import { PhaseType } from '@presentation/app/create-recipe/model/phase-type';
import { ValueConstants } from '@core/constants';

const GEN_STEP_COUNT = 5;
const GEN_STEP_INTERVAL_MS = 620;

/**
 * Which line of the "generating" checklist is lit while the backend works.
 *
 * @remarks
 * - **Paced, not reported.** The backend sends no progress; the checklist
 *   advances on a timer and holds on its last line until the answer lands.
 * - **Each generation starts at the first line**, set in the render that
 *   enters the phase, so a second generate never opens on the old step.
 */
export const useGenerationTicker = (phase: PhaseType): number => {
  const [ticker, setTicker] = useState({ phase, step: ValueConstants.zero });
  if (ticker.phase !== phase) setTicker({ phase, step: ValueConstants.zero });

  useEffect(() => {
    if (phase !== PhaseType.Generating) return;
    const id = setInterval(() => {
      setTicker((current) => ({ ...current, step: Math.min(GEN_STEP_COUNT - ValueConstants.one, current.step + ValueConstants.one) }));
    }, GEN_STEP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [phase]);

  return ticker.phase === phase ? ticker.step : ValueConstants.zero;
};
