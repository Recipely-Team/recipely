/**
 * The iPad shipped the phone layout. `isWebShell` answered two questions at
 * once — "is there room for the wide layout" and "is the browser chrome
 * mounted" — and because a tablet is not a browser, a 13" iPad (1032pt
 * portrait, well past the 900pt desktop breakpoint) fell through to the
 * single-column phone layout stretched across the screen.
 *
 * These pin the split: `isExpanded` asks only about width, `isWebShell` still
 * requires the web. The tablet case is the one that was broken.
 */
import { useContext } from 'react';
import { LayoutContext, LayoutProvider } from '@presentation/base/responsive/layout-context';
import type { LayoutContextValue } from '@presentation/base/responsive/layout-context-value';
import { renderComponent } from '@presentation/base/test-support/render-component';

let mockWidth = 390;
let mockHeight = 844;
let mockIsWeb = false;

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: (): { width: number; height: number } => ({ width: mockWidth, height: mockHeight }),
}));

jest.mock('@infrastructure/constants/platform', () => ({
  isWeb: (): boolean => mockIsWeb,
}));

const readLayout = (width: number, height: number, isWeb: boolean): LayoutContextValue => {
  mockWidth = width;
  mockHeight = height;
  mockIsWeb = isWeb;

  let captured: LayoutContextValue | undefined;
  const Probe = (): null => {
    captured = useContext(LayoutContext);
    return null;
  };

  renderComponent(
    <LayoutProvider>
      <Probe />
    </LayoutProvider>,
  );

  if (captured === undefined) throw new Error('layout never published');
  return captured;
};

describe('LayoutProvider — width and chrome are separate questions', () => {
  it('gives a phone neither the wide layout nor the web chrome', () => {
    const layout = readLayout(390, 844, false);

    expect(layout.isExpanded).toBe(false);
    expect(layout.isWebShell).toBe(false);
    expect(layout.isCompact).toBe(true);
  });

  // The bug: an iPad is wide enough for the grids and the columned recipe
  // detail, but it is not a browser, so it must keep its native chrome.
  it('gives a 13" iPad the wide layout but not the web chrome', () => {
    const layout = readLayout(1032, 1376, false);

    expect(layout.isExpanded).toBe(true);
    expect(layout.isWebShell).toBe(false);
    expect(layout.isCompact).toBe(false);
  });

  it('gives a desktop browser both', () => {
    const layout = readLayout(1440, 900, true);

    expect(layout.isExpanded).toBe(true);
    expect(layout.isWebShell).toBe(true);
  });

  // Width, not device class: a tablet dragged into a Split View column is a
  // phone-shaped viewport again and must lose the grids with it.
  it('takes the wide layout back when an iPad is squeezed into Split View', () => {
    const layout = readLayout(507, 1376, false);

    expect(layout.isExpanded).toBe(false);
    expect(layout.isCompact).toBe(true);
  });
});
