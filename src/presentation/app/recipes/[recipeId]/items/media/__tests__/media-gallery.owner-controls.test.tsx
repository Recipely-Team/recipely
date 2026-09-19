/**
 * The symptom: "mobilde de gözükmüyor" — on the phone the owner could see
 * neither photo control.
 *
 * Neither was missing from the tree. Both were drawn somewhere the user could
 * not reach:
 *
 * - **Add** sat at `bottom: spacing.md` (12) and stood 32 tall, so it filled
 *   the hero's bottom 12–44pt. `MobileRecipeDetail` pulls its content card up
 *   by `spacing.xxl` (32) — and that card is a LATER SIBLING, so it paints and
 *   hit-tests above the hero. Twenty of the button's thirty-two points were
 *   buried, the centred camera icon almost entirely, and a tap in that band
 *   went to the card.
 * - **Remove** sat at `top: spacing.md` on a hero that runs edge to edge under
 *   the status bar, in the same corner `RecipeFloatingActions` already claims
 *   at `insetsTop + spacing.sm`.
 *
 * So these are geometry tests, not presence tests: a test that only asked
 * "is the button rendered?" passed the whole time the bug was live.
 */

import { View } from 'react-native';
import { MediaGallery } from '@presentation/app/recipes/[recipeId]/items/media/media-gallery';
import { mobileContentOverlap } from '@presentation/app/recipes/[recipeId]/model/mobile-content-overlap';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

const media = [
  { id: 'm1', type: 'image' as const, url: 'https://cdn.example.com/1.jpg' },
  { id: 'm2', type: 'image' as const, url: 'https://cdn.example.com/2.jpg' },
];

const owner = { onAdd: jest.fn(), onRemove: jest.fn(), isBusy: false };

const flatten = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? style.reduce<Record<string, unknown>>((all, one) => ({ ...all, ...flatten(one) }), {})
    : ((style ?? {}) as Record<string, unknown>);

/** The absolutely-positioned cluster the owner's buttons live in. */
const ownerCluster = (root: ReturnType<typeof renderComponent>['root']) =>
  root
    .findAllByType(View)
    .map((node) => flatten(node.props.style))
    .find((style) => style['position'] === 'absolute' && typeof style['bottom'] === 'number');

describe('MediaGallery owner controls — reachable, not merely rendered', () => {
  it('lifts the controls clear of what the screen draws over the hero', () => {
    const { root } = renderComponent(
      <MediaGallery media={media} owner={owner} contentOverlap={mobileContentOverlap} />,
    );

    const cluster = ownerCluster(root);

    expect(cluster).toBeDefined();
    // The whole button, not just its top edge: anything below this line is
    // under an opaque card that also swallows the press.
    expect(Number(cluster?.['bottom'])).toBeGreaterThanOrEqual(mobileContentOverlap);
  });

  // The offset has to FOLLOW the overlap, not merely happen to exceed today's
  // value. This is the drift `mobileContentOverlap` exists to stop: deepen the
  // card and a hard-coded clearance silently starts burying the buttons again.
  it('tracks the overlap it is given', () => {
    const shallow = renderComponent(<MediaGallery media={media} owner={owner} contentOverlap={0} />);
    const deep = renderComponent(
      <MediaGallery media={media} owner={owner} contentOverlap={mobileContentOverlap * 2} />,
    );

    const shallowBottom = Number(ownerCluster(shallow.root)?.['bottom']);
    const deepBottom = Number(ownerCluster(deep.root)?.['bottom']);

    expect(deepBottom - shallowBottom).toBe(mobileContentOverlap * 2);
    expect(deepBottom).toBeGreaterThanOrEqual(mobileContentOverlap * 2);
  });

  it('offers both controls in one cluster rather than opposite corners', () => {
    const { root } = renderComponent(
      <MediaGallery media={media} owner={owner} contentOverlap={mobileContentOverlap} />,
    );

    const labels = root
      .findAll((n) => typeof n.props['accessibilityLabel'] === 'string')
      .map((n) => String(n.props['accessibilityLabel']));

    expect(labels).toContain(t().recipes.addPhoto);
    expect(labels).toContain(t().recipes.removePhoto);

    // Both under ONE bottom-pinned parent. Neither is pinned to the top edge
    // any more: on a phone that corner is the status bar's, and the share /
    // like / save cluster's after that. (The dot indicator is also absolute
    // and also near the top — which is why this asks about the two controls
    // rather than about absolute positioning in general.)
    const cluster = root
      .findAllByType(View)
      .find((node) => {
        const style = flatten(node.props.style);
        return style['position'] === 'absolute' && typeof style['bottom'] === 'number';
      });
    const inCluster = cluster
      ?.findAll((n) => typeof n.props['accessibilityLabel'] === 'string')
      .map((n) => String(n.props['accessibilityLabel']));

    expect(inCluster).toContain(t().recipes.addPhoto);
    expect(inCluster).toContain(t().recipes.removePhoto);
  });

  // The web hero has nothing drawn over it, so it must not pay for the phone's
  // card — the default keeps the controls where they were.
  it('sits at the plain inset when nothing overlaps', () => {
    const { root } = renderComponent(<MediaGallery media={media} owner={owner} />);

    expect(Number(ownerCluster(root)?.['bottom'])).toBeLessThan(mobileContentOverlap);
  });

  it('offers no controls at all to someone who does not own the recipe', () => {
    const { root } = renderComponent(<MediaGallery media={media} />);

    const labels = root
      .findAll((n) => typeof n.props['accessibilityLabel'] === 'string')
      .map((n) => String(n.props['accessibilityLabel']));

    expect(labels).not.toContain(t().recipes.addPhoto);
    expect(labels).not.toContain(t().recipes.removePhoto);
  });
});
