export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  primaryLight: string;
  primaryGradientStart: string;
  primaryGradientEnd: string;
  secondary: string;
  secondaryText: string;
  danger: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  border: string;
  chipBackground: string;
  chipText: string;
  cardBackground: string;
  cardBorder: string;
  inputBackground: string;
  inputBorder: string;
  inputBorderFocused: string;
  skeleton: string;
  skeletonHighlight: string;
  shadow: string;
  overlay: string;
  starFilled: string;
  starEmpty: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  avatarBackground: string;
  sectionBackground: string;
  /**
   * Text/icon color for content sitting on `colors.overlay` (semi-transparent dark
   * backdrop on hero images, recipe-card chips). ALWAYS white in both variants —
   * overlays are darken-by-design regardless of theme variant.
   */
  onOverlay: string;
  /**
   * Text/icon color for content sitting on `colors.success` (checkmarks in checkbox/
   * task widgets, success-state badge fill). ALWAYS dark in both variants — `success`
   * is always a green tinted toward 0.4-0.5 luminance and requires dark text.
   */
  onSuccess: string;
  /** Rose-red used for liked/active heart icons — consistent across all themes. */
  likeActive: string;
  /** Semi-transparent dark overlay for image overlays and floating buttons. */
  overlayLight: string;
  /**
   * Slate-tinted scrim behind centered web modal dialogs (e.g. the web filter
   * modal). ALWAYS the same dark slate tint in both variants — modal scrims are
   * darken-by-design regardless of theme variant.
   */
  scrim: string;
  /** Danger color at 10% opacity, used for danger-tinted button backgrounds. */
  dangerLight: string;
  /** Frosted glass surface for gradient section cards and modals. */
  gradientSurface: string;
  /** Frosted glass border for elements on top of gradient backgrounds. */
  gradientBorder: string;
  /**
   * Dark text for the white "View recipe" hero button / rank badge on the web
   * home. ALWAYS dark (`#0F172A`) in both variants — `colors.primary` can be a
   * bright pastel in dark themes that fails AA on white, so a constant is used.
   */
  heroButtonText: string;
}
