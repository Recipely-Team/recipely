/**
 * Remove asks before it removes.
 *
 * The viewer's Remove button only raises the question; the photo goes when the
 * owner answers yes in the confirmation, and not at all when they cancel. It
 * is their own picture, and it may be the only one the recipe has.
 */

/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

import { act } from 'react-test-renderer';
import { RecipePhotoViewer } from '@presentation/app/recipes/[recipeId]/items/media/recipe-photo-viewer';
import { RecipeDetailSheets } from '@presentation/app/recipes/[recipeId]/sheets/recipe-detail-sheets';
import { usePhotoRemoval } from '@presentation/app/recipes/[recipeId]/hooks/photos/use-photo-removal';
import { PhotoViewerVariant } from '@presentation/app/recipes/[recipeId]/model/photos/photo-viewer-variant';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';
import type { MediaItem } from '@domain/recipes/media/media-item';

const PHOTOS: MediaItem[] = [
  { id: 'm1', type: 'image', url: 'https://x.test/1.jpg' },
  { id: 'm2', type: 'image', url: 'https://x.test/2.jpg' },
];

const noop = (): void => undefined;

/** The screen's wiring, cut down to the viewer and the sheets that answer it. */
const Screen = ({ remove }: { remove: (item: MediaItem) => Promise<void> }): React.JSX.Element => {
  const removal = usePhotoRemoval(remove);
  return (
    <>
      <RecipePhotoViewer
        media={PHOTOS}
        variant={PhotoViewerVariant.Framed}
        owner={{ onAdd: noop, onRemove: removal.request, isBusy: false }}
      />
      <RecipeDetailSheets
        unsavePending={false}
        onConfirmUnsave={noop}
        onCancelUnsave={noop}
        photoPendingRemoval={removal.pending}
        onConfirmRemovePhoto={removal.confirm}
        onCancelRemovePhoto={removal.cancel}
        photoError={null}
        onDismissPhotoError={noop}
        commentDeletePending={false}
        onConfirmDeleteComment={noop}
        onCancelDeleteComment={noop}
        showDeleteSheet={false}
        deleteError={null}
        isDeleting={false}
        onCloseDelete={noop}
        onConfirmDelete={noop}
        promptVisible={false}
        promptMessage={undefined}
        onClosePrompt={noop}
        onGoToSignIn={noop}
      />
    </>
  );
};

type Root = ReturnType<typeof renderComponent>['root'];

const pressLabel = (root: Root, label: string): void => {
  const node = root.findAll((n) => n.props['accessibilityLabel'] === label && typeof n.props['onPress'] === 'function')[0];
  if (node === undefined) throw new Error(`nothing pressable is labelled "${label}"`);
  act(() => (node.props['onPress'] as () => void)());
};

const pressText = (root: Root, text: string): void => {
  const node = root.findAll(
    (n) => typeof n.props['onPress'] === 'function' && n.findAll((c) => c.children.includes(text)).length > 0,
  );
  const target = node[node.length - 1];
  if (target === undefined) throw new Error(`nothing pressable reads "${text}"`);
  act(() => (target.props['onPress'] as () => void)());
};

const confirmSheetOpen = (root: Root): boolean =>
  root.findAll((n) => n.children.includes(t().recipes.removePhotoConfirm)).length > 0;

describe('removing a photo from the recipe', () => {
  it('asks before removing, and removes the photo in view on yes', () => {
    const remove = jest.fn(async () => undefined);
    const { root } = renderComponent(<Screen remove={remove} />);

    pressLabel(root, t().photoViewer.removeA11y);

    expect(remove).not.toHaveBeenCalled();
    expect(confirmSheetOpen(root)).toBe(true);

    pressText(root, t().photoViewer.remove);

    expect(remove).toHaveBeenCalledWith(PHOTOS[0]);
  });

  it('removes nothing when the owner cancels', () => {
    const remove = jest.fn(async () => undefined);
    const { root } = renderComponent(<Screen remove={remove} />);

    pressLabel(root, t().photoViewer.removeA11y);
    pressText(root, t().common.cancel);

    expect(remove).not.toHaveBeenCalled();
  });
});
