/**
 * Fixed third-party brand colors. Unlike theme colors these never vary by the
 * light/dark scheme — the Apple sign-in button is always black (Apple HIG) and
 * the Google mark is always Google's four hues — so they live here as constants
 * rather than as theme tokens that flip. Referenced instead of hard-coding a
 * bare hex on a brand surface.
 */
export const BrandColors = {
  /** No fill at all — an unselected chip, a borderless control. */
  transparent: 'transparent',
  /** Neutral fixed white for brand surfaces and marks (never theme-tinted). */
  white: '#FFFFFF',
  /** Apple sign-in button surface. */
  black: '#000000',
  /** Google sign-in button label ink. */
  googleLabel: '#1F2937',
  googleBlue: '#4285F4',
  googleRed: '#EA4335',
  googleGreen: '#34A853',
  googleYellow: '#FBBC05',
  /**
   * Instagram's gradient, corner to corner. Four stops, not three: the warm
   * orange between the yellow and the pink is what stops the sweep reading as
   * a flat magenta wash at ring width.
   */
  instagramGradientStart: '#F9CE34',
  instagramGradientWarm: '#EE583F',
  instagramGradientMid: '#EE2A7B',
  instagramGradientEnd: '#6228D7',
  /**
   * Instagram's colours as INK on the provenance seal's white face, not the
   * import card's plate: each stop is at least 3:1 on white, which the plate's
   * yellow is not.
   */
  instagramInkOrange: '#F56040',
  instagramInkPink: '#E1306C',
  instagramInkMagenta: '#C13584',
  instagramInkPurple: '#833AB4',
  /**
   * TikTok's note. The near-black carries the shape (18:1 on white); the red
   * echo is 3.9:1 and the cyan one is decoration only, as in TikTok's own mark.
   */
  tiktokNote: '#121212',
  tiktokCyan: '#25F4EE',
  tiktokRed: '#FE2C55',
  /** Facebook's blue as outline ink on the seal's white face, 5.0:1. */
  facebookInk: '#0866FF',
  /** YouTube's red as outline ink on the seal's white face, 4.0:1. */
  youtubeInk: '#FF0000',
  /** A web page's globe: neutral slate rather than any site's colour, 10.4:1 on white. */
  webInk: '#334155',
  /** The AI sparkles' indigo-to-teal ink, both stops at least 3:1 on white. */
  aiInkIndigo: '#4F46E5',
  aiInkTeal: '#0E7490',
  /**
   * The seal's ring over a photo: slate at 62%, about #6A6F7B over white — 5.1:1
   * against a white pixel, while the white face gives 21:1 against a black one.
   */
  sealRing: 'rgba(15,23,42,0.62)',
  /** The hairline between two marks in one capsule. */
  sealDivider: 'rgba(15,23,42,0.18)',
  /**
   * The light round controls drawn ON a photo — the hero's previous / next
   * arrows and a Created card's camera button. Fixed in both modes: what they
   * sit on is the picture, not the theme.
   */
  photoControl: 'rgba(255,255,255,0.94)',
  /** Glyph on a {@link photoControl}. */
  photoControlInk: '#1E293B',
  /** Hairline round a white {@link photoControl} so it holds its edge on a white plate. */
  photoControlBorder: 'rgba(15,23,42,0.14)',
  /** The clear end of a scrim gradient over a photo — black at zero, so the fade never greys. */
  photoScrimClear: 'rgba(0,0,0,0)',
  /**
   * The macro daily-value bars on the nutrition panel. Fixed across every
   * theme and mode, as the prototype draws them: a macro keeps its colour so a
   * reader who learned "blue is protein" never has to relearn it per palette.
   */
  nutritionProtein: '#3B82F6',
  nutritionCarbs: '#F59E0B',
  nutritionFat: '#EF4444',
  nutritionFiber: '#10B981',
  /**
   * The full-colour Recipely logo (`RecipelyLogo`), from the brand SVG: the
   * hat's warm gradient, the book's grey gradient, the orange of the cover and
   * cutlery, the off-white hat, the cream pages and the grey page edges.
   */
  logoHatGradientStart: '#EC7B41',
  logoHatGradientEnd: '#F9B050',
  logoBookGradientStart: '#97999A',
  logoBookGradientEnd: '#C4C2C0',
  logoOrange: '#EE8941',
  logoOffWhite: '#F0F3F1',
  logoCream: '#F8E9D4',
  logoGrey: '#BEC0C3',
  /**
   * What the browser paints its own chrome with around the web app
   * (`<meta name="theme-color">` in `+html.tsx`), one per system scheme —
   * the default theme's page background in each.
   */
  webChromeLight: '#FFFFFF',
  webChromeDark: '#0B0B0D',
  /** The assistant mascot (`AssistantMascot`): skin gradient, cheeks, eyes, mouth, chef hat, hat-band shade. */
  mascotFaceTop: '#F8DCBB',
  mascotFaceBottom: '#EFC08F',
  mascotCheek: '#E98A6A',
  mascotEye: '#3B2A1E',
  mascotMouth: '#B4483C',
  mascotHat: '#FFFFFF',
  mascotBandShade: '#000000',
  /**
   * The web home hero's photo gradient, deep → mid → fade, in the same slate as
   * the modal scrim, and the frosted fill of its Save button. Fixed across
   * themes: they sit on a photograph, not on a theme surface.
   */
  heroOverlayDeep: 'rgba(15,23,42,0.9)',
  heroOverlayMid: 'rgba(15,23,42,0.55)',
  heroOverlayFade: 'rgba(15,23,42,0.05)',
  heroSaveFill: 'rgba(255,255,255,0.14)',
} as const;
