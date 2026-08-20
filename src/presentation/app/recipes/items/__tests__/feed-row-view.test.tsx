/**
 * Regression test for the feed banner that ran edge to edge.
 *
 * The symptom: the ad between two recipe cards touched both screen edges while
 * every card around it was inset. An anchored adaptive banner asks the SDK for
 * a size and defaults to the DEVICE width, then renders at it regardless of the
 * padding on its container — so the width has to be REQUESTED, not styled on.
 * This fails against the version that rendered `<AdSlot>` without one.
 */
import { renderComponent } from '@presentation/base/test-support/render-component';
import { FeedRowView } from '@presentation/app/recipes/items/feed-row-view';
import { FeedRowKind } from '@presentation/app/recipes/model/ads/feed-row-kind';
import { ValueConstants } from '@core/constants';

const mockAdSlot = jest.fn();

jest.mock('@presentation/base/widgets/ads/ad-slot', () => ({
  AdSlot: (props: unknown) => mockAdSlot(props),
}));

describe('FeedRowView', () => {
  it('requests the banner at the row width, so it lines up with the cards', () => {
    mockAdSlot.mockReset().mockReturnValue(null);

    renderComponent(
      <FeedRowView
        row={{ kind: FeedRowKind.Ad, ordinal: ValueConstants.zero }}
        gridColumns={ValueConstants.one}
        adUnitId="unit-1"
        adWidth={343}
        openRecipe={() => () => undefined}
      />,
    );

    expect(mockAdSlot).toHaveBeenCalledWith(expect.objectContaining({ width: 343 }));
  });
});
