import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import { isIos } from '@infrastructure/constants/platform';
import { ValueConstants } from '@core/constants';

/**
 * Speaks `message` to VoiceOver whenever it appears or changes.
 *
 * @remarks
 * - **iOS only.** Toasts and form banners relied on `accessibilityLiveRegion`,
 *   which only Android implements, so on iOS a failed sign-in, a failed save or
 *   "Added to shopping list" was never spoken. Android keeps the live region —
 *   announcing there too would read every message twice.
 */
export const useAnnounce = (message: string | undefined): void => {
  useEffect(() => {
    if (!isIos() || message === undefined || message.length === ValueConstants.zero) return;
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
};
