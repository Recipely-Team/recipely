/**
 * The pager reports which photo is in view, and only the photos a user swipes to.
 *
 * The bug: `onScroll` also fires during the pager's OWN animated
 * `scrollToOffset`, so an arrow or thumb jump from photo 1 to photo 5 reported
 * 2, 3 and 4 on the way and the counter flickered through them.
 */

import { useState } from 'react';
import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { act } from 'react-test-renderer';
import { PhotoPager } from '@presentation/app/recipes/[recipeId]/items/media/photo-pager';
import { renderComponent } from '@presentation/base/test-support/render-component';
import type { MediaItem } from '@domain/recipes/media/media-item';

const WIDTH = 300;
const HEIGHT = 225;
const FIVE: MediaItem[] = [1, 2, 3, 4, 5].map((n) => ({ id: `m${n}`, type: 'image', url: `https://x.test/${n}.jpg` }));

const scrollEvent = (page: number): NativeSyntheticEvent<NativeScrollEvent> =>
  ({ nativeEvent: { contentOffset: { x: page * WIDTH, y: 0 } } }) as NativeSyntheticEvent<NativeScrollEvent>;

const mount = (initial: number, onSwipe: jest.Mock) => {
  let setCurrent: (next: number) => void = () => undefined;
  const Host = (): React.JSX.Element => {
    const [current, set] = useState(initial);
    setCurrent = set;
    return <PhotoPager media={FIVE} width={WIDTH} height={HEIGHT} current={current} onSwipe={onSwipe} />;
  };
  const rendered = renderComponent(<Host />);
  const list = () => rendered.renderer.root.findByType(FlatList);
  const scrollTo = (page: number): void => {
    act(() => (list().props.onScroll as (e: NativeSyntheticEvent<NativeScrollEvent>) => void)(scrollEvent(page)));
  };
  const beginDrag = (): void => {
    act(() => (list().props.onScrollBeginDrag as () => void)());
  };
  const jumpTo = (next: number): void => {
    act(() => setCurrent(next));
  };
  return { list, scrollTo, beginDrag, jumpTo };
};

describe('PhotoPager — what it reports', () => {
  it('a jump from the first photo to the fifth flickered the counter through 2, 3 and 4', () => {
    const onSwipe = jest.fn();
    const pager = mount(0, onSwipe);

    pager.jumpTo(4);
    [1, 2, 3, 4].forEach(pager.scrollTo);

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('reports a user swipe once the jump has landed', () => {
    const onSwipe = jest.fn();
    const pager = mount(0, onSwipe);

    pager.jumpTo(4);
    pager.scrollTo(4);
    pager.scrollTo(3);

    expect(onSwipe).toHaveBeenCalledWith(3);
  });

  it('a drag during a jump wins: the finger is reported, never steered', () => {
    const onSwipe = jest.fn();
    const pager = mount(0, onSwipe);

    pager.jumpTo(4);
    pager.scrollTo(1);
    pager.beginDrag();
    pager.scrollTo(2);

    expect(onSwipe).toHaveBeenCalledWith(2);
  });

  it('reports a plain swipe', () => {
    const onSwipe = jest.fn();
    const pager = mount(0, onSwipe);

    pager.scrollTo(1);

    expect(onSwipe).toHaveBeenCalledWith(1);
  });

  it('keys each photo on its id, not its position', () => {
    const pager = mount(0, jest.fn());
    const keyOf = pager.list().props.keyExtractor as (item: MediaItem, index: number) => string;

    expect(keyOf(FIVE[1] as MediaItem, 1)).toBe('m2');
    expect(keyOf({ type: 'image', url: 'https://x.test/cover.jpg' }, 0)).toBe('https://x.test/cover.jpg');
  });
});
