import { useCallback } from 'react';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { CharConstants } from '@core/constants';
import { creatorWebUrl } from '@infrastructure/constants/api/api-hosts';
import { showSuccessToast } from '@presentation/base/feedback/show-toast';
import { t } from '@presentation/i18n';

/**
 * Shares a creator's page through the system sheet.
 *
 * @remarks
 * - **Falls back to copying the link.** A desktop browser has no share sheet
 *   (`navigator.share` is missing and `Share.share` rejects), so the link goes
 *   on the clipboard with a "Copied" toast instead of the button doing nothing.
 */
export const useShareCreator = (): ((userId: string, name: string) => void) =>
  useCallback((userId: string, name: string) => {
    const url = creatorWebUrl(encodeURIComponent(userId));
    const message = [t().creators.shareText.replace('{name}', name), url].join(CharConstants.space);
    void Share.share({ message, url, title: name }).catch(async () => {
      try {
        await Clipboard.setStringAsync(url);
        showSuccessToast(t().recipes.shareCopied);
      } catch {
        // Neither a share sheet nor a clipboard: nothing left to offer.
      }
    });
  }, []);
