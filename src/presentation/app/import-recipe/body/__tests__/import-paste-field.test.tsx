/**
 * The paste field says WHICH link it understood, not only that it understood
 * one: a recognised link swaps the neutral link icon for its platform's glyph,
 * in the same white seal a recipe card wears.
 */
import { HOST_TOKEN } from '@presentation/app/import-recipe/model/host-token';
import { ImportLink } from '@domain/recipes/import/import-link';
import { ProvenanceMark } from '@domain/recipes/provenance/provenance-mark';
import { ProvenanceGlyph } from '@presentation/base/widgets/badges/provenance-glyph';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { ImportPasteField } from '@presentation/app/import-recipe/body/import-paste-field';
import { en } from '@presentation/i18n/locales/en';

const linkOf = (raw: string): ImportLink => {
  const link = ImportLink.create(raw);
  if (!link.ok) throw new Error(`fixture link refused: ${raw}`);
  return link.value;
};

const render = (recognised: ImportLink | null) =>
  renderComponent(
    <ImportPasteField
      value=""
      onChangeValue={jest.fn()}
      onBlur={jest.fn()}
      onSubmit={jest.fn()}
      onPaste={jest.fn()}
      recognised={recognised}
      hasFailure={false}
    />,
  ).root;

const glyphs = (recognised: ImportLink | null): unknown[] =>
  render(recognised).findAllByType(ProvenanceGlyph).map((n) => n.props.mark);

const labels = (recognised: ImportLink | null): string[] =>
  render(recognised)
    .findAll((n) => typeof n.props['accessibilityLabel'] === 'string')
    .map((n) => String(n.props['accessibilityLabel']));

describe('ImportPasteField', () => {
  it('shows no platform glyph before a link is recognised', () => {
    expect(glyphs(null)).toEqual([]);
  });

  it('shows the Instagram glyph for a reel', () => {
    const reel = linkOf('https://www.instagram.com/reel/Cx1y2z3/');

    expect(glyphs(reel)).toEqual([ProvenanceMark.Instagram]);
    expect(labels(reel)).toContain(en.importRecipe.pasteDetectedInstagram);
  });

  it('shows the globe for a recipe page and names the site', () => {
    const page = linkOf('https://www.nefisyemektarifleri.com/menemen-tarifi/');

    expect(glyphs(page)).toEqual([ProvenanceMark.Web]);
    expect(labels(page)).toContain(en.importRecipe.pasteDetectedWeb.replace(HOST_TOKEN, 'nefisyemektarifleri.com'));
  });
});
