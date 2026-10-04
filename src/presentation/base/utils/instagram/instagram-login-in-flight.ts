import { ValueConstants } from '@core/constants';

let open = ValueConstants.zero;

/**
 * Whether this app instance has an Instagram login open right now — so the
 * return route can tell Android's copy of a link the auth session is already
 * finishing (in flight) from one that reached a freshly started app with no
 * session behind it (a cold start), whose code must not be finalized twice
 * and is reported as "didn't finish" instead.
 */
export const InstagramLoginInFlight = {
  begin: (): void => {
    open += ValueConstants.one;
  },
  end: (): void => {
    open = Math.max(ValueConstants.zero, open - ValueConstants.one);
  },
  get isOpen(): boolean {
    return open > ValueConstants.zero;
  },
};
