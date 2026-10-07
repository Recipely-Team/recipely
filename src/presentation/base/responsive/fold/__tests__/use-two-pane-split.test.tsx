import { FoldOrientation } from '@domain/display/fold-orientation';
import { FoldState } from '@domain/display/fold-state';
import type { WindowPosture } from '@domain/display/window-posture';
import { LayoutContext } from '@presentation/base/responsive/layout-context';
import type { LayoutContextValue } from '@presentation/base/responsive/layout-context-value';
import { OrientationType } from '@presentation/base/responsive/orientation-type';
import { useTwoPaneSplit } from '@presentation/base/responsive/fold/use-two-pane-split';
import type { TwoPaneSplit } from '@presentation/base/responsive/fold/two-pane-split';
import { renderComponent } from '@presentation/base/test-support/render-component';

const layout = (width: number, height: number, fold: WindowPosture | null): LayoutContextValue => ({
  width,
  height,
  aspectRatio: width / height,
  orientation: width >= height ? OrientationType.Landscape : OrientationType.Portrait,
  breakpoint: width >= 900 ? 'desktop' : 'tablet',
  isWebShell: false,
  isExpanded: width >= 900,
  isCompact: false,
  fold,
});

const readSplit = (value: LayoutContextValue): TwoPaneSplit => {
  let captured: TwoPaneSplit | undefined;
  const Probe = (): null => {
    captured = useTwoPaneSplit();
    return null;
  };
  renderComponent(
    <LayoutContext.Provider value={value}>
      <Probe />
    </LayoutContext.Provider>,
  );
  if (captured === undefined) throw new Error('split never computed');
  return captured;
};

const bookFold = (x: number, width: number, height: number): WindowPosture => ({
  isSeparating: true,
  orientation: FoldOrientation.Vertical,
  state: FoldState.HalfOpened,
  hinge: { x, y: 0, width, height },
});

describe('useTwoPaneSplit — hero | card screens and the hinge', () => {
  // The bug this guards: two `flex: 1` panes on a spanned Duo meet at 557 dp, so
  // the hinge (540–574) cut 17 dp off the hero and 17 dp off the form card.
  it('puts the first pane on the left Duo screen and the hinge in the gap', () => {
    const split = readSplit(layout(1114, 720, bookFold(540, 34, 720)));

    expect(split.isSplit).toBe(true);
    expect(split.firstPaneStyle).toEqual({ flexGrow: 0, flexShrink: 0, flexBasis: 540 });
    expect(split.rowStyle).toEqual({ columnGap: 34 });
  });

  it('splits a half-opened Pixel Fold even though it is narrower than the wide breakpoint', () => {
    const split = readSplit(layout(841, 701, bookFold(420, 0, 701)));

    expect(split.isSplit).toBe(true);
    expect(split.firstPaneStyle).toEqual({ flexGrow: 0, flexShrink: 0, flexBasis: 420 });
  });

  it('keeps the equal flex split on a wide landscape window without a fold', () => {
    expect(readSplit(layout(1280, 800, null))).toEqual({ isSplit: true, rowStyle: null, firstPaneStyle: null });
  });

  it('keeps the stacked layout in tabletop posture', () => {
    const tabletop: WindowPosture = { ...bookFold(0, 0, 0), orientation: FoldOrientation.Horizontal, hinge: { x: 0, y: 420, width: 841, height: 0 } };

    expect(readSplit(layout(841, 840, tabletop)).isSplit).toBe(false);
  });
});
