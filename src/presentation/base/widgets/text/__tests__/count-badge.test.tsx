/**
 * The count badge was written out three times — twice on the recipes headers,
 * and once more when the My-Recipes tabs started wearing one. These pin the
 * behaviour the copies shared, so the shared widget cannot lose it.
 */

import type { ReactTestInstance } from 'react-test-renderer';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { CountBadge } from '@presentation/base/widgets/text/count-badge';
import { CountBadgeTone } from '@presentation/base/widgets/text/count-badge-tone';
import { maxFontScales } from '@presentation/base/theme';

const render = (count: number): RenderResult => renderComponent(<CountBadge count={count} />);

describe('CountBadge', () => {
  it('shows the count', () => {
    expect(textContent(render(4).root)).toContain('4');
  });

  it('renders nothing at zero — a red "0" says something needs attention when nothing does', () => {
    expect(textContent(render(0).root)).toEqual([]);
  });

  it('renders nothing for a negative count', () => {
    expect(textContent(render(-1).root)).toEqual([]);
  });

  it('shows the exact count up to nine', () => {
    expect(textContent(render(9).root)).toContain('9');
  });

  it('caps a tally only where the digits would burst the disc, not at nine', () => {
    // Shipped capping every badge at "9+", which turned "you have 43 drafts"
    // into no answer at all on the one screen that exists to tell you.
    const tally = (count: number): RenderResult =>
      renderComponent(<CountBadge count={count} tone={CountBadgeTone.Tally} />);

    expect(textContent(tally(43).root)).toContain('43');
    expect(textContent(tally(99).root)).toContain('99');
    expect(textContent(tally(150).root)).toContain('99+');
  });

  it('caps at "9+" once the count outgrows the circle it is drawn in', () => {
    const texts = textContent(render(15).root);

    expect(texts).toContain('9+');
    expect(texts).not.toContain('15');
  });

  it('caps the OS font multiplier so the digits cannot burst the disc', () => {
    // The one place rule 6b sanctions a cap: a fixed-diameter shape whose text
    // cannot reflow. Everything else gets a flexible box instead.
    const { root } = render(4);

    expect(
      root.findAll((node: ReactTestInstance) => node.props.maxFontSizeMultiplier === maxFontScales.badge),
    ).not.toHaveLength(0);
  });
});
