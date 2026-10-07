/**
 * Regression test for the feed banner that ran edge to edge.
 *
 * The symptom: the ad between two recipe cards touched both screen edges while
 * every card around it was inset. An anchored adaptive banner asks the SDK for
 * a size and defaults to the DEVICE width, then renders at it regardless of the
 * padding on its container — so the width has to be REQUESTED, not styled on.
 * This fails against the version that rendered `<AdSlot>` without one.
 */
import { useState } from 'react';
import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { recipeSummaryOf } from '@application/__fixtures__/recipe-summary-of';
import { FeedRowView } from '@presentation/app/recipes/items/feed-row-view';
import { FeedRowKind } from '@presentation/app/recipes/model/ads/feed-row-kind';
import { ValueConstants } from '@core/constants';

const mockAdSlot = jest.fn();

jest.mock('@presentation/base/widgets/ads/ad-slot', () => ({
  AdSlot: (props: unknown) => mockAdSlot(props),
}));

const mockRowRenders = jest.fn();

// Memoised like the real row, so a fresh `onOpen` identity is what would re-render it.
jest.mock('@presentation/app/recipes/items/cards/recipe-list-item', () => {
  const { memo: memoOf } = jest.requireActual<typeof import('react')>('react');
  return {
    RecipeListItem: memoOf((props: unknown) => {
      mockRowRenders(props);
      return null;
    }),
  };
});

describe('FeedRowView', () => {
  // Render storm: the row called a curried `openRecipe(id)`, so every parent render handed the
  // memoised card a brand-new `onPress` and every visible card re-rendered on scroll.
  it('does not re-render a recipe card when the feed re-renders with the same row', () => {
    mockRowRenders.mockReset();
    const row = { kind: FeedRowKind.Recipe, recipe: recipeSummaryOf('r1') } as const;
    const onOpenRecipe = jest.fn();
    const rerender: { bump: () => void } = { bump: () => undefined };
    const Feed = (): React.JSX.Element => {
      const [, setTick] = useState(ValueConstants.zero);
      rerender.bump = () => setTick((n) => n + ValueConstants.one);
      return <FeedRowView row={row} gridColumns={1} adUnitId="unit-1" adWidth={343} onOpenRecipe={onOpenRecipe} />;
    };
    renderComponent(<Feed />);

    act(() => rerender.bump());
    act(() => rerender.bump());

    expect(mockRowRenders).toHaveBeenCalledTimes(1);
  });

  it('requests the banner at the row width, so it lines up with the cards', () => {
    mockAdSlot.mockReset().mockReturnValue(null);

    renderComponent(
      <FeedRowView
        row={{ kind: FeedRowKind.Ad, ordinal: ValueConstants.zero }}
        gridColumns={ValueConstants.one}
        adUnitId="unit-1"
        adWidth={343}
        onOpenRecipe={() => undefined}
      />,
    );

    expect(mockAdSlot).toHaveBeenCalledWith(expect.objectContaining({ width: 343 }));
  });
});
