/**
 * The symptom: "the detail hero cropped a portrait photo to a sliver (hands
 * and pots)".
 *
 * Every photo in the hero was drawn `cover` into a 4:3 frame. A phone shot of
 * a dish is portrait, so the crop kept a thin horizontal band from its middle
 * — the cook's hands and the rim of a pot — and threw the dish away.
 *
 * A photo meaningfully narrower than its frame is now shown whole
 * (`contain`) over a blurred copy of itself; a landscape photo is still
 * cropped. Both ratios are measured: the photo's from its decoded size, the
 * frame's from layout.
 */

import { act } from 'react-test-renderer';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { SmartPhoto } from '@presentation/app/recipes/[recipeId]/items/media/smart-photo';
import { renderComponent } from '@presentation/base/test-support/render-component';

const URL = 'https://cdn.example.com/dish.jpg';
const FRAME = { width: 400, height: 300 };

const renderLoaded = (photo: { width: number; height: number }) => {
  const rendered = renderComponent(<SmartPhoto url={URL} accessibilityLabel="Photo 1 of 1" />);
  const frame = rendered.root.findAllByType(View).find((n) => typeof n.props['onLayout'] === 'function');
  act(() => (frame?.props['onLayout'] as (e: object) => void)({ nativeEvent: { layout: FRAME } }));
  const sharp = rendered.root.findAllByType(Image).find((n) => typeof n.props['onLoad'] === 'function');
  act(() => (sharp?.props['onLoad'] as (e: object) => void)({ source: { ...photo, url: URL, mediaType: null } }));
  return rendered.root.findAllByType(Image);
};

describe('the detail hero cropped a portrait photo to a sliver (hands and pots)', () => {
  it('shows a portrait photo whole, over a blurred copy of itself', () => {
    const images = renderLoaded({ width: 1080, height: 1920 });

    expect(images).toHaveLength(2);
    const [blurred, sharp] = images;
    expect(blurred?.props['blurRadius']).toBeGreaterThan(0);
    expect(blurred?.props['contentFit']).toBe('cover');
    expect(blurred?.props['importantForAccessibility']).toBe('no-hide-descendants');
    expect(sharp?.props['contentFit']).toBe('contain');
  });

  it('treats a square photo in a 4:3 frame as portrait too', () => {
    const images = renderLoaded({ width: 1200, height: 1200 });

    expect(images.find((n) => n.props['contentFit'] === 'contain')).toBeDefined();
  });

  it('still crops a landscape photo to fill the frame', () => {
    const images = renderLoaded({ width: 1600, height: 1200 });

    expect(images).toHaveLength(1);
    expect(images[0]?.props['contentFit']).toBe('cover');
  });
});
