import { useEffect, useState } from 'react';
import { ValueConstants } from '@core/constants';
import { ScanTiming } from '@presentation/app/fridge/model/scan/scan-timing';

/**
 * Which photo the analysing step highlights: the first, then each next one
 * every `ScanTiming.photoMs`, holding on the last until the scan answers.
 */
export const useScanPhotoCue = (count: number): number => {
  const [index, setIndex] = useState(ValueConstants.zero);
  useEffect(() => {
    if (count <= ValueConstants.one) return;
    const id = setInterval(() => {
      setIndex((current) => Math.min(count - ValueConstants.one, current + ValueConstants.one));
    }, ScanTiming.photoMs);
    return () => clearInterval(id);
  }, [count]);
  return index;
};
