/**
 * The recipe's photo viewer: what it says about position, and what it offers
 * the owner.
 *
 * Carried over from the gallery it replaced, because both were real bugs:
 *
 * - Removing the LAST photo while looking at it left the counter reading
 *   "3 / 2" and took the remove button with it — the index is only moved by a
 *   swipe, and removing a photo swipes nothing.
 * - The owner's controls were once drawn under the phone's content card, which
 *   is a later sibling and so paints and hit-tests above the hero. These are
 *   geometry assertions, not presence ones: "is it rendered?" passed the whole
 *   time that bug was live.
 */

import { useState } from 'react';
import { act } from 'react-test-renderer';
import { RecipePhotoViewer } from '@presentation/app/recipes/[recipeId]/items/media/recipe-photo-viewer';
import { PhotoViewerVariant } from '@presentation/app/recipes/[recipeId]/model/photos/photo-viewer-variant';
import { mobileContentOverlap } from '@presentation/app/recipes/[recipeId]/model/mobile-content-overlap';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';
import type { MediaItem } from '@domain/recipes/media/media-item';

const photo = (n: number): MediaItem => ({ id: `m${n}`, type: 'image', url: `https://x.test/${n}.jpg` });
const THREE = [photo(1), photo(2), photo(3)];
const owner = () => ({ onAdd: jest.fn(), onRemove: jest.fn(), isBusy: false });

type Root = ReturnType<typeof renderComponent>['root'];

const byLabel = (root: Root, label: string) =>
  root.findAll((n) => n.props['accessibilityLabel'] === label && typeof n.props['onPress'] === 'function')[0];

const press = (root: Root, label: string): void => {
  const node = byLabel(root, label);
  act(() => (node?.props['onPress'] as () => void)());
};

const flatten = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? style.reduce<Record<string, unknown>>((all, one) => ({ ...all, ...flatten(one) }), {})
    : ((style ?? {}) as Record<string, unknown>);

const position = (i: number, n: number): string =>
  t().photoViewer.position.replace('{i}', String(i)).replace('{n}', String(n));

describe('RecipePhotoViewer — the counter', () => {
  it('reads "1 / 3" on the first photo', () => {
    const { root } = renderComponent(<RecipePhotoViewer media={THREE} variant={PhotoViewerVariant.Bleed} />);

    expect(textContent(root)).toContain('1 / 3');
  });

  it('follows a thumbnail to "2 / 3"', () => {
    const { root } = renderComponent(<RecipePhotoViewer media={THREE} variant={PhotoViewerVariant.Bleed} />);

    press(root, position(2, 3));

    expect(textContent(root)).toContain('2 / 3');
  });

  it('draws no counter for a single photo', () => {
    const { root } = renderComponent(<RecipePhotoViewer media={[photo(1)]} variant={PhotoViewerVariant.Bleed} />);

    expect(textContent(root)).not.toContain('1 / 1');
  });

  it('keeps the counter and Remove on a photo that still exists after the last one goes', () => {
    const controls = owner();
    let setMedia!: (m: MediaItem[]) => void;
    const Host = (): React.JSX.Element => {
      const [media, set] = useState<MediaItem[]>(THREE);
      setMedia = set;
      return <RecipePhotoViewer media={media} variant={PhotoViewerVariant.Framed} owner={controls} />;
    };
    const { root } = renderComponent(<Host />);
    press(root, position(3, 3));
    expect(textContent(root)).toContain('3 / 3');

    act(() => setMedia(THREE.slice(0, 2)));

    expect(textContent(root)).toContain('2 / 2');
    press(root, t().photoViewer.removeA11y);
    expect(controls.onRemove).toHaveBeenCalledWith(THREE[1]);
  });
});

describe('RecipePhotoViewer — the owner', () => {
  it('asks the screen about the photo in view, the cover included', () => {
    const controls = owner();
    const cover: MediaItem = { type: 'image', url: 'https://x.test/cover.jpg' };
    const { root } = renderComponent(
      <RecipePhotoViewer media={[cover]} variant={PhotoViewerVariant.Bleed} owner={controls} />,
    );

    press(root, t().photoViewer.removeA11y);

    expect(controls.onRemove).toHaveBeenCalledWith(cover);
  });

  it('offers Add in the strip once there is a photo', () => {
    const controls = owner();
    const { root } = renderComponent(
      <RecipePhotoViewer media={[photo(1)]} variant={PhotoViewerVariant.Bleed} owner={controls} />,
    );

    press(root, t().photoViewer.add);

    expect(controls.onAdd).toHaveBeenCalledTimes(1);
  });

  it('offers the first photo on an empty hero, clear of the card drawn over it', () => {
    const controls = owner();
    const { root } = renderComponent(
      <RecipePhotoViewer
        media={[]}
        variant={PhotoViewerVariant.Bleed}
        owner={controls}
        contentOverlap={mobileContentOverlap}
      />,
    );

    const button = byLabel(root, t().photoViewer.addFirst);
    const anchor = button?.parent?.parent;
    expect(Number(flatten(anchor?.props['style'])['bottom'])).toBeGreaterThanOrEqual(mobileContentOverlap);
    press(root, t().photoViewer.addFirst);
    expect(controls.onAdd).toHaveBeenCalledTimes(1);
  });

  it('offers nothing to someone who does not own the recipe', () => {
    const { root } = renderComponent(<RecipePhotoViewer media={THREE} variant={PhotoViewerVariant.Framed} />);

    expect(byLabel(root, t().photoViewer.add)).toBeUndefined();
    expect(byLabel(root, t().photoViewer.removeA11y)).toBeUndefined();
    expect(textContent(root)).not.toContain(t().photoViewer.cover);
  });
});
