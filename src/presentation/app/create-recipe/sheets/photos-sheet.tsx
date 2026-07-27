import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { MediaPicker } from '@presentation/app/create-recipe/items/media-picker';
import { t } from '@presentation/i18n';
import type { MediaItem } from '@domain/recipes/media/media-item';

export interface PhotosSheetProps {
  visible: boolean;
  media: readonly MediaItem[];
  onAdd: (items: MediaItem[]) => void;
  onRemove: (index: number) => void;
  onSetCover: (index: number) => void;
  onClose: () => void;
}

/**
 * Cover-photo editing, wrapping the shared `MediaPicker`.
 *
 * Presented through the shared {@link BottomSheet} rather than its own `Modal`:
 * that component is what decides sheet-on-mobile / dialog-on-web, and a
 * hand-rolled copy of it slid up from the bottom edge of a desktop window.
 */
export const PhotosSheet = ({
  visible,
  media,
  onAdd,
  onRemove,
  onSetCover,
  onClose,
}: PhotosSheetProps): React.JSX.Element => (
  <BottomSheet
    visible={visible}
    title={t().createRecipe.photosTitle}
    onClose={onClose}
    rightAction={{ label: t().createRecipe.donePhotos, onPress: onClose }}
  >
    <MediaPicker media={media} onAdd={onAdd} onRemove={onRemove} onSetCover={onSetCover} />
  </BottomSheet>
);
