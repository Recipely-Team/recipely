import { useEffect } from 'react';
import { KeyboardKey } from '@presentation/base/constants';
import { isWeb } from '@infrastructure/constants/platform';
import { ValueConstants } from '@core/constants';

/**
 * ← and → step the recipe's photo viewer while it has keyboard focus.
 *
 * Web only: the listener sits on `document`, and it is attached only while the
 * frame is focused, so the arrow keys keep scrolling the page everywhere else.
 */
export const usePhotoArrowKeys = (enabled: boolean, onStep: (delta: number) => void): void => {
  useEffect(() => {
    if (!enabled || !isWeb()) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === KeyboardKey.arrowLeft) {
        event.preventDefault();
        onStep(-ValueConstants.one);
      } else if (event.key === KeyboardKey.arrowRight) {
        event.preventDefault();
        onStep(ValueConstants.one);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled, onStep]);
};
