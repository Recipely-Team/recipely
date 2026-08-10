import { useEffect, useRef } from 'react';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import type { Failure } from '@presentation/base/types';

/**
 * Reports a failure the moment a screen decides to SHOW it.
 *
 * @remarks
 * - **Why a hook and not a call inside `ErrorState`.** The widget is handed
 *   strings, not a `Failure` — by the time it renders, the code and message
 *   that make a report worth reading are gone.
 * - **Once per failure, not once per render.** A full-screen error state
 *   re-renders on every theme change, keyboard event and parent update; the
 *   identity check is what keeps one broken request from becoming forty
 *   identical reports.
 */
export const useReportFailure = (failure: Failure | null, context: string): void => {
  const reported = useRef<Failure | null>(null);

  useEffect(() => {
    if (failure === null) {
      reported.current = null;
      return;
    }
    if (reported.current === failure) return;
    reported.current = failure;
    FailureReporter.report(failure, context);
  }, [failure, context]);
};
