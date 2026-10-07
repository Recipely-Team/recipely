/**
 * The web export threw React error #418 (hydration mismatch) on every tab route
 * — /recipes, /my-recipes, /settings, /diary. No icon font was registered before
 * render, so the prerender drew each `@expo/vector-icons` glyph as an empty
 * `<Text />`; in the browser the root TabBar mounted first, registered the font,
 * and the screen's icons then hydrated as real glyphs. These specs hold the fix:
 * the root layout registers every icon family it ships, up front.
 */

import fs from 'node:fs';
import path from 'node:path';
import { act, create } from 'react-test-renderer';
import { useFonts } from 'expo-font';
import { useIconFonts } from '@presentation/navigation/use-icon-fonts';

jest.mock('expo-font', () => ({ useFonts: jest.fn(() => [true, null]) }));

const useFontsMock = useFonts as jest.MockedFunction<typeof useFonts>;

const SRC = path.resolve(__dirname, '../../..');
const ROOT_LAYOUT = path.join(SRC, 'presentation/app/_layout.tsx');
const ICON_IMPORT = /from '@expo\/vector-icons\/([A-Za-z0-9]+)'/g;

/** Every `.ts`/`.tsx` under `src/`, tests excluded. */
const sources = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sources(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });

/** The `@expo/vector-icons` families the app imports anywhere under `src/`. */
const importedFamilies = (): string[] => {
  const families = new Set<string>();
  for (const file of sources(SRC)) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(ICON_IMPORT)) families.add(match[1]);
  }
  return [...families].sort();
};

const fontFamiliesOf = (family: string): string[] => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the family is only known at run time
  const icons = require(`@expo/vector-icons/${family}`) as { default: { font: Record<string, unknown> } };
  return Object.keys(icons.default.font);
};

const Probe = (): null => {
  useIconFonts();
  return null;
};

const registeredFonts = (): string[] => {
  act(() => {
    create(<Probe />);
  });
  const [map] = useFontsMock.mock.calls[0];
  return typeof map === 'string' ? [map] : Object.keys(map);
};

describe('icons on a tab route hydrate without React error #418', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers the font of every icon family the app imports', () => {
    const families = importedFamilies();
    expect(families.length).toBeGreaterThan(0);
    const registered = registeredFonts();
    for (const family of families) {
      expect({ family, missing: fontFamiliesOf(family).filter((font) => !registered.includes(font)) }).toEqual({
        family,
        missing: [],
      });
    }
  });

  it('is called by the root layout, ahead of every screen', () => {
    expect(fs.readFileSync(ROOT_LAYOUT, 'utf8')).toMatch(/export const RootLayout = \(\)[^{]*\{\s*useIconFonts\(\);/);
  });
});
