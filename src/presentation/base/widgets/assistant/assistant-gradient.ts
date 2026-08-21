import { ValueConstants } from '@core/constants';

/**
 * The diagonal every gradient on this surface runs along.
 *
 * Declared once because five sibling files drew the same one, and rule 5's test
 * is reuse: naming a value five times is not naming it.
 */
export const assistantGradient = {
  start: { x: ValueConstants.zero, y: ValueConstants.zero },
  end: { x: ValueConstants.one, y: ValueConstants.one },
} as const;
