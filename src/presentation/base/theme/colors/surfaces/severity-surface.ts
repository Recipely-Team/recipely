/** The four tinted tokens every severity surface is built from. */
export interface SeveritySurface {
  /** Background fill for banners, cards, and chat bubbles. */
  bg: string;
  /** Hairline border. */
  border: string;
  /** Body / label text color that meets contrast on `bg`. */
  text: string;
  /** Icon / accent color. */
  icon: string;
  /** Illustration disc fill behind the icon. */
  disc: string;
}
