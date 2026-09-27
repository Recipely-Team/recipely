/**
 * A cropped photo is positioned on the dish, not on the frame's centre.
 *
 * A centred `cover` crop of a hand-held shot lands on a wrist or a pot rim as
 * often as on the food. The backend finds each photo's focal point; the hero
 * passes it to expo-image as a percentage `contentPosition`. Without one the
 * crop stays centred, and a portrait photo shown whole ignores it.
 */

import { act } from 'react-test-renderer';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { SmartPhoto } from '@presentation/app/recipes/[recipeId]/items/media/smart-photo';
import { FocalPoint } from '@domain/recipes/media/focal-point';
import { renderComponent } from '@presentation/base/test-support/render-component';

const URL = 'https://cdn.example.com/dish.jpg';
const FRAME = { width: 400, height: 300 };

const point = (x: number, y: number): FocalPoint => {
  const p = FocalPoint.create(x, y);
  if (!p.ok) throw new Error('fixture');
  return p.value;
};

const sharpImage = (focus: FocalPoint | undefined, photo: { width: number; height: number }) => {
  const rendered = renderComponent(<SmartPhoto url={URL} focus={focus} accessibilityLabel="Photo 1 of 1" />);
  const frame = rendered.root.findAllByType(View).find((n) => typeof n.props['onLayout'] === 'function');
  act(() => (frame?.props['onLayout'] as (e: object) => void)({ nativeEvent: { layout: FRAME } }));
  const sharp = rendered.root.findAllByType(Image).find((n) => typeof n.props['onLoad'] === 'function');
  act(() => (sharp?.props['onLoad'] as (e: object) => void)({ source: { ...photo, url: URL, mediaType: null } }));
  return rendered.root.findAllByType(Image).find((n) => typeof n.props['onLoad'] === 'function');
};

describe('a cropped hero photo centred on hands and pots instead of the dish', () => {
  it('positions a landscape crop on the focal point, as percentages', () => {
    const image = sharpImage(point(0.3, 0.75), { width: 1600, height: 900 });

    expect(image?.props['contentFit']).toBe('cover');
    expect(image?.props['contentPosition']).toEqual({ left: '30%', top: '75%' });
  });

  it('keeps the crop centred when the photo has no focal point yet', () => {
    const image = sharpImage(undefined, { width: 1600, height: 900 });

    expect(image?.props['contentPosition']).toBe('center');
  });

  it('shows a portrait photo whole and centred, focal point or not', () => {
    const image = sharpImage(point(0.1, 0.1), { width: 1080, height: 1920 });

    expect(image?.props['contentFit']).toBe('contain');
    expect(image?.props['contentPosition']).toBe('center');
  });
});
