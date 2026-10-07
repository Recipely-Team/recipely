import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const ICON_FONTS = { ...Ionicons.font, ...MaterialCommunityIcons.font };

/**
 * **Registers the icon fonts before the first icon renders.**
 *
 * @remarks
 * - An `@expo/vector-icons` glyph renders an EMPTY `<Text />` until its font is
 *   registered. Nothing registered them up front, so the static export
 *   prerendered every icon empty — while in the browser the first icon to MOUNT
 *   (the root TabBar, which hydrates ahead of the lazily loaded screen) injected
 *   the `@font-face`, and the screen's own icons then hydrated as real glyphs.
 *   That mismatch was React error #418 on every tab route.
 * - Called once at the very top of the root layout. On the server `useFonts`
 *   registers synchronously, so the prerender draws real glyphs and ships the
 *   `@font-face` rules in `<head>`; the browser's first render finds them there
 *   and draws the same glyphs. On native it is the load the icons did anyway.
 * - Every icon family imported under `src/` must be in `ICON_FONTS` — the
 *   `use-icon-fonts` test fails on a family that is not, and
 *   `scripts/assert-icon-fonts.mjs` checks the exported HTML.
 */
export const useIconFonts = (): void => {
  useFonts(ICON_FONTS);
};
