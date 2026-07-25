/**
 * `ThemeGrid` renders the trimmed 3-4 color palette, and its color-name
 * label reserves enough height for a two-line (e.g. Turkish) translation
 * without a fixed max height that would clip it — see `theme-grid.tsx`.
 */

import { renderComponent } from '@presentation/base/test-support/render-component';
import { ThemeGrid } from '@presentation/base/widgets/settings/theme-grid';
import { ALL_THEMES, getThemeDefinition } from '@presentation/base/theme/colors/palette/themes';

/** Recursively flattens a possibly-nested RN style prop into one object. */
const flattenStyle = (style: unknown): Record<string, unknown> => {
  return Array.isArray(style)
    ? Object.assign({}, ...style.map(flattenStyle))
    : ((style as Record<string, unknown> | undefined) ?? {});
};

describe('ThemeGrid — palette size', () => {
  it('offers exactly 4 selectable themes (trimmed from the original 19)', () => {
    expect(ALL_THEMES.length).toBe(4);
  });

  it('keeps the default theme (pearl-white) in the trimmed palette', () => {
    expect(ALL_THEMES).toContain('pearl-white');
  });

  it('renders one label per theme, using the Turkish name when localized', () => {
    const { root } = renderComponent(<ThemeGrid selectedThemeId="pearl-white" onSelect={jest.fn()} />);

    const texts = root
      .findAllByType('Text')
      .map((n) => n.children.filter((c): c is string => typeof c === 'string').join(''))
      .filter((s) => s.length > 0);

    for (const id of ALL_THEMES) {
      expect(texts).toContain(getThemeDefinition(id).name);
    }
  });
});

describe('ThemeGrid — label sizing (TR wrap regression)', () => {
  it('reserves at least two lines of height on the label so it never gets a fixed single-line height', () => {
    const { root } = renderComponent(<ThemeGrid selectedThemeId="pearl-white" onSelect={jest.fn()} />);

    const labelNode = root.findAllByType('Text').find((n) => {
      const style = flattenStyle(n.props.style);
      return typeof style.minHeight === 'number';
    });

    expect(labelNode).toBeDefined();
    const style = flattenStyle(labelNode?.props.style);
    const lineHeight = style.lineHeight as number;
    const minHeight = style.minHeight as number;

    // minHeight must fit (at least) two lines, and must not be pinned to an
    // exact `height` that would clip a wrapped second line.
    expect(minHeight).toBeGreaterThanOrEqual(lineHeight * 2);
    expect(style.height).toBeUndefined();
  });

  it('allows two lines via numberOfLines so long translated names wrap instead of getting clipped to one line', () => {
    const { root } = renderComponent(<ThemeGrid selectedThemeId="pearl-white" onSelect={jest.fn()} />);

    const labelNode = root.findAllByType('Text').find((n) => {
      const style = flattenStyle(n.props.style);
      return typeof style.minHeight === 'number';
    });

    expect(labelNode?.props.numberOfLines).toBe(2);
  });
});
