/**
 * Recipely Kitchen recipes wear the Recipely logo in the same seal slot as the
 * AI and import marks, and say "Recipely Kitchen" — on the card's seal and in
 * the detail screen's chip — with nothing to link to.
 */
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { ProvenanceNote } from '@presentation/base/widgets/badges/provenance-note';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { ProvenanceMark } from '@domain/recipes/provenance/provenance-mark';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

const CURATED = [ProvenanceMark.Curated];

describe('the Recipely Kitchen mark', () => {
  it('draws the Recipely logo in the card seal, named Recipely Kitchen', () => {
    const { root } = renderComponent(<ProvenanceSeal marks={CURATED} surface={SealSurface.Photo} size={27} />);

    expect(root.findAllByType(RecipelyLogo)).toHaveLength(1);
    expect(root.findAll((n) => n.props['accessibilityLabel'] === t().recipes.originCuratedA11y).length).toBeGreaterThan(0);
  });

  it('reads as a Recipely Kitchen chip on the detail screen, with no link', () => {
    const { root } = renderComponent(<ProvenanceNote marks={CURATED} />);

    expect(root.findAllByType(RecipelyLogo)).toHaveLength(1);
    expect(root.findAll((n) => n.props.children === t().recipes.originCuratedDetailLabel).length).toBeGreaterThan(0);
    expect(root.findAll((n) => n.props['accessibilityRole'] === 'link')).toHaveLength(0);
  });
});
