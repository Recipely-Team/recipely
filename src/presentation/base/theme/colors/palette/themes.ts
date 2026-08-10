import type { ThemeId } from '@presentation/base/theme/context/theme-id';
import type { ThemeColors } from '@presentation/base/theme/colors/palette/theme-colors';
import type { ThemeDefinition } from '@presentation/base/theme/context/theme-definition';
import type { VariantSemantics } from '@presentation/base/theme/colors/surfaces/variant-semantics';
import type { Palette } from '@presentation/base/theme/colors/palette/palette';
import { RadixConstants, RegexConstants, ValueConstants } from '@core/constants';
import type { ThemeVariant } from '@presentation/base/theme/context/theme-variant';

/** Offsets of the R, G and B pairs inside `#RRGGBB` — index 0 is the '#'. */
const R_START = 1;
const G_START = 3;
const B_START = 5;
/** Largest value one 8-bit colour channel can hold. */
const CHANNEL_MAX = 255;
/** Pad character for a single-digit hex byte. */
const HEX_PAD = '0';

const parseRgb = (hex: string): [number, number, number] => {
  if (!RegexConstants.hexColor6.test(hex)) {
    throw new Error(`themes.ts mixHex requires #RRGGBB, got: ${hex}`);
  }
  // Skips the leading '#', then two hex chars per channel.
  return [R_START, G_START, B_START].map((at) =>
    parseInt(hex.slice(at, at + RadixConstants.hexCharsPerByte), RadixConstants.hex),
  ) as [number, number, number];
};

const toHex2 = (n: number): string => {
  const clamped = Math.max(ValueConstants.zero, Math.min(CHANNEL_MAX, Math.round(n)));
  return clamped.toString(RadixConstants.hex).padStart(RadixConstants.hexCharsPerByte, HEX_PAD);
};

const mixHex = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = parseRgb(a);
  const [br, bg, bb] = parseRgb(b);
  return `#${toHex2(ar + (br - ar) * t)}${toHex2(ag + (bg - ag) * t)}${toHex2(ab + (bb - ab) * t)}`;
};

const DARK_NEUTRAL_BG = '#0B0B0D';
const DARK_SURFACE_TARGET = '#52535A';
const DARK_TEXT = '#F1F5F9';
const DARK_TEXT_MUTED = '#64748B';
const LIGHT_TEXT = '#0F172A';
const LIGHT_TEXT_MUTED = '#64748B';

const darkSemantics: VariantSemantics = {
  danger: '#F28B82',
  success: '#81C995',
  warning: '#FDD663',
  starFilled: '#FFD54F',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: '#000000',
  onOverlay: '#FFFFFF',
  onSuccess: '#0F1B0F',
  likeActive: '#F43F5E',
  overlayLight: 'rgba(0,0,0,0.4)',
  scrim: 'rgba(15,23,42,0.55)',
  gradientSurface: 'rgba(255,255,255,0.18)',
  gradientBorder: 'rgba(255,255,255,0.28)',
};

const lightSemantics: VariantSemantics = {
  danger: '#D93025',
  success: '#34A853',
  warning: '#FBBC04',
  starFilled: '#FFB800',
  overlay: 'rgba(0,0,0,0.55)',
  shadow: '#0F172A',
  onOverlay: '#FFFFFF',
  onSuccess: '#0F1B0F',
  likeActive: '#F43F5E',
  overlayLight: 'rgba(0,0,0,0.4)',
  scrim: 'rgba(15,23,42,0.55)',
  gradientSurface: 'rgba(255,255,255,0.18)',
  gradientBorder: 'rgba(255,255,255,0.28)',
};

const makeColors = (palette: Palette, semantics: VariantSemantics, surface: string): ThemeColors => ({
  background: palette.background,
  surface,
  text: palette.text,
  textMuted: palette.textMuted,
  primary: palette.primary,
  primaryText: palette.primaryText,
  primaryLight: palette.primaryLight,
  primaryGradientStart: palette.gradientStart,
  primaryGradientEnd: palette.gradientEnd,
  secondary: palette.secondary,
  secondaryText: palette.secondaryText,
  danger: semantics.danger,
  success: semantics.success,
  successLight: palette.primaryLight,
  warning: semantics.warning,
  warningLight: palette.primaryLight,
  border: palette.textMuted + '40',
  chipBackground: palette.primaryLight,
  chipText: palette.primary,
  cardBackground: surface,
  cardBorder: palette.textMuted + '20',
  inputBackground: surface,
  inputBorder: palette.textMuted + '40',
  inputBorderFocused: palette.primary,
  skeleton: palette.textMuted + '30',
  skeletonHighlight: palette.textMuted + '10',
  shadow: semantics.shadow,
  overlay: semantics.overlay,
  starFilled: semantics.starFilled,
  starEmpty: palette.textMuted,
  tabBarBackground: surface,
  tabBarBorder: palette.textMuted + '30',
  tabBarActive: palette.primary,
  tabBarInactive: palette.textMuted,
  avatarBackground: palette.primaryLight,
  sectionBackground: surface,
  onOverlay: semantics.onOverlay,
  onSuccess: semantics.onSuccess,
  likeActive: semantics.likeActive,
  overlayLight: semantics.overlayLight,
  scrim: semantics.scrim,
  dangerLight: semantics.danger + '1A',
  gradientSurface: semantics.gradientSurface,
  gradientBorder: semantics.gradientBorder,
  heroButtonText: '#0F172A',
});

const makeDark = (a: DarkArgs): ThemeColors => {
  const palette: Palette = {
    primary: a.primary,
    primaryText: a.primaryText,
    primaryLight: a.primaryLight,
    gradientStart: a.gradientStart,
    gradientEnd: a.gradientEnd,
    background: a.background,
    text: a.text ?? DARK_TEXT,
    textMuted: a.textMuted ?? DARK_TEXT_MUTED,
    secondary: a.secondary,
    secondaryText: a.secondaryText,
  };
  const surface = mixHex(a.background, DARK_SURFACE_TARGET, 0.5);
  return makeColors(palette, darkSemantics, surface);
};

const makeLight = (a: LightArgs): ThemeColors => {
  const palette: Palette = {
    primary: a.primary,
    primaryText: a.primaryText,
    primaryLight: a.primaryLight,
    gradientStart: a.gradientStart,
    gradientEnd: a.gradientEnd,
    background: a.background,
    text: a.text ?? LIGHT_TEXT,
    textMuted: a.textMuted ?? LIGHT_TEXT_MUTED,
    secondary: a.secondary,
    secondaryText: a.secondaryText,
  };
  const surface = mixHex(a.background, '#FFFFFF', 0.55);
  return makeColors(palette, lightSemantics, surface);
};

const themes: Record<ThemeId, ThemeDefinition> = {
  'pearl-white': {
    name: 'Pearl White',
    nameTr: 'İnci Beyazı',
    description: 'Clean, airy light mode with blue accents',
    preferredVariant: 'light',
    light: makeLight({
      primary: '#1D4ED8', primaryText: '#FFFFFF', primaryLight: '#DBEAFE',
      gradientStart: '#3B82F6', gradientEnd: '#60A5FA',
      background: '#E8EFFB', secondary: '#60A5FA', secondaryText: '#0F172A',
    }),
    dark: makeDark({
      primary: '#60A5FA', primaryText: DARK_NEUTRAL_BG, primaryLight: '#1E3A5F',
      gradientStart: '#3B82F6', gradientEnd: '#93C5FD',
      background: '#0A1A33', secondary: '#93C5FD', secondaryText: DARK_NEUTRAL_BG,
    }),
  },
  'crimson-ember': {
    name: 'Crimson Ember',
    nameTr: 'Kırmızı Kor',
    description: 'Bold, passionate red for energy and urgency',
    preferredVariant: 'light',
    light: makeLight({
      primary: '#B91C1C', primaryText: '#FFFFFF', primaryLight: '#FEE2E2',
      gradientStart: '#DC2626', gradientEnd: '#F87171',
      background: '#FBE7E7', secondary: '#DC2626', secondaryText: '#FFFFFF',
      text: '#1F1F1F', textMuted: '#6B7280',
    }),
    dark: makeDark({
      primary: '#F87171', primaryText: '#1F1F1F', primaryLight: '#450A0A',
      gradientStart: '#EF4444', gradientEnd: '#FCA5A5',
      background: '#1A0309', secondary: '#F87171', secondaryText: '#1F1F1F',
      text: '#FEF2F2', textMuted: '#A78B8B',
    }),
  },
  'emerald-garden': {
    name: 'Emerald Garden',
    nameTr: 'Zümrüt Bahçe',
    description: 'Deep emerald green suggesting growth and balance',
    preferredVariant: 'light',
    light: makeLight({
      primary: '#053A29', primaryText: '#FFFFFF', primaryLight: '#D1FAE5',
      gradientStart: '#059669', gradientEnd: '#34D399',
      background: '#D6F2E2', secondary: '#047857', secondaryText: '#FFFFFF',
      text: '#1A2E1A', textMuted: '#6B7280',
    }),
    dark: makeDark({
      primary: '#34D399', primaryText: '#1A2E1A', primaryLight: '#022C22',
      gradientStart: '#10B981', gradientEnd: '#6EE7B7',
      background: '#04382B', secondary: '#34D399', secondaryText: '#1A2E1A',
      text: '#ECFDF5', textMuted: '#70A090',
    }),
  },
  'royal-purple': {
    name: 'Royal Purple',
    nameTr: 'Kraliyet Moru',
    description: 'Bold purple on dark surfaces for a regal mood',
    preferredVariant: 'dark',
    light: makeLight({
      primary: '#7E22CE', primaryText: '#FFFFFF', primaryLight: '#F3E8FF',
      gradientStart: '#9333EA', gradientEnd: '#C084FC',
      background: '#EDDDFB', secondary: '#9333EA', secondaryText: '#FFFFFF',
      text: '#3B0764', textMuted: '#6B7280',
    }),
    dark: makeDark({
      primary: '#C084FC', primaryText: '#3B0764', primaryLight: '#3B0764',
      gradientStart: '#A855F7', gradientEnd: '#E9D5FF',
      background: '#2A075F', secondary: '#C084FC', secondaryText: '#3B0764',
      text: '#FAF5FF', textMuted: '#9878A8',
    }),
  },
};

interface DarkArgs {
  primary: string;
  primaryText: string;
  primaryLight: string;
  gradientStart: string;
  gradientEnd: string;
  background: string;
  secondary: string;
  secondaryText: string;
  text?: string;
  textMuted?: string;
}

interface LightArgs {
  primary: string;
  primaryText: string;
  primaryLight: string;
  gradientStart: string;
  gradientEnd: string;
  background: string;
  secondary: string;
  secondaryText: string;
  text?: string;
  textMuted?: string;
}

export const ALL_THEMES: ThemeId[] = [
  'pearl-white', 'crimson-ember', 'emerald-garden', 'royal-purple',
];

export const getThemeDefinition = (id: ThemeId): ThemeDefinition => themes[id];

export const getThemeColors = (id: ThemeId, scheme: ThemeVariant): ThemeColors =>
  scheme === 'dark' ? themes[id].dark : themes[id].light;

