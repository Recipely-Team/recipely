import { useCallback, useRef, type RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ShareCardLayout } from '@presentation/app/recipes/[recipeId]/model/share/share-card-layout';

const PNG = 'png';
const PNG_MIME = 'image/png';
/** iOS names the file type by UTI, not MIME. */
const PNG_UTI = 'public.png';

/**
 * Captures the off-screen `RecipeShareCard` as a 1080×1920 PNG and opens the
 * system share sheet with it — Instagram offers Story, Reel, Feed and Message
 * there; WhatsApp sends it as a photo or a Status.
 *
 * @remarks
 * - **Waits for the photo.** A capture before the image loads shares a blank
 *   square, so `share` waits on the card's `onReady`.
 * - **Never a dead end.** Returns `false` when the device cannot share files
 *   or the capture fails, and the sheet falls back to sharing the link.
 */
export const useShareCard = (): {
  cardRef: RefObject<View | null>;
  onCardReady: () => void;
  shareCard: (dialogTitle: string) => Promise<boolean>;
} => {
  const cardRef = useRef<View | null>(null);
  const ready = useRef(false);
  const waiters = useRef<(() => void)[]>([]);

  const onCardReady = useCallback((): void => {
    ready.current = true;
    waiters.current.forEach((resolve) => resolve());
    waiters.current = [];
  }, []);

  const shareCard = useCallback(async (dialogTitle: string): Promise<boolean> => {
    try {
      if (!(await Sharing.isAvailableAsync())) return false;
      if (!ready.current) await new Promise<void>((resolve) => waiters.current.push(resolve));
      const uri = await captureRef(cardRef, {
        format: PNG,
        width: ShareCardLayout.exportWidth,
        height: ShareCardLayout.exportHeight,
      });
      await Sharing.shareAsync(uri, { mimeType: PNG_MIME, dialogTitle, UTI: PNG_UTI });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { cardRef, onCardReady, shareCard };
};
