/**
 * The symptom: after removing the LAST photo of a gallery while looking at it,
 * the counter read "3 / 2" and the remove button disappeared, so the owner
 * could not take off the next photo either.
 *
 * `active` is only updated by a scroll event, and removing a slide scrolls
 * nothing — it stayed one past the end. Every read now goes through an index
 * clamped to the gallery that is actually there.
 *
 * And the cover: it used to be the one photo with no remove button, because a
 * cover-only recipe maps to a gallery item with no id. It has its own request
 * now, so every slide offers the control.
 */

import { useState } from 'react';
import { act } from 'react-test-renderer';
import { FlatList, View } from 'react-native';
import { MediaGallery } from '@presentation/app/recipes/[recipeId]/items/media/media-gallery';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';
import type { MediaItem } from '@domain/recipes/media/media-item';

const SLIDE_WIDTH = 300;
const photo = (n: number): MediaItem => ({ id: `m${n}`, type: 'image', url: `https://x.test/${n}.jpg` });
const THREE = [photo(1), photo(2), photo(3)];

const texts = (root: ReturnType<typeof renderComponent>['root']): string =>
  root
    .findAll((n) => typeof n.props['children'] !== 'undefined' && n.children.every((c) => typeof c === 'string'))
    .map((n) => n.children.join(''))
    .join('|');

describe('MediaGallery after a photo is removed', () => {
  it('keeps the counter and the remove control on a photo that still exists', () => {
    const owner = { onAdd: jest.fn(), onRemove: jest.fn(), isBusy: false };
    let setMedia!: (m: MediaItem[]) => void;
    const Host = (): React.JSX.Element => {
      const [media, set] = useState<MediaItem[]>(THREE);
      setMedia = set;
      return <MediaGallery media={media} owner={owner} />;
    };
    const { root } = renderComponent(<Host />);

    const frame = root.findAllByType(View).find((n) => typeof n.props['onLayout'] === 'function');
    const onLayout = frame?.props['onLayout'] as (event: object) => void;
    act(() => onLayout({ nativeEvent: { layout: { width: SLIDE_WIDTH } } }));
    // Read after the layout: the handler closes over the measured width.
    const onScroll = root.findByType(FlatList).props['onScroll'] as (event: object) => void;
    act(() => onScroll({ nativeEvent: { contentOffset: { x: SLIDE_WIDTH * 2 } } }));
    expect(texts(root)).toContain('3 / 3');

    act(() => setMedia(THREE.slice(0, 2)));

    expect(texts(root)).toContain('2 / 2');
    const remove = root.find((n) => n.props['accessibilityLabel'] === t().recipes.removePhoto);
    act(() => (remove.props['onPress'] as () => void)());
    expect(owner.onRemove).toHaveBeenCalledWith(THREE[1]);
  });

  it('offers to remove a cover that has no gallery row', () => {
    const owner = { onAdd: jest.fn(), onRemove: jest.fn(), isBusy: false };
    const cover: MediaItem = { type: 'image', url: 'https://x.test/cover.jpg' };
    const { root } = renderComponent(<MediaGallery media={[cover]} owner={owner} />);

    const remove = root.find((n) => n.props['accessibilityLabel'] === t().recipes.removePhoto);
    act(() => (remove.props['onPress'] as () => void)());

    expect(owner.onRemove).toHaveBeenCalledWith(cover);
  });
});
