/** The three inks one food-diary status is drawn in (design spec → Food Diary §2.1). */
export interface DiaryTone {
  /** Cell and strip fill. */
  bg: string;
  /** Text and marker on `bg` — at least 7:1 against it. */
  fg: string;
  /** Ring, swatch and bar fill on a card — at least 3:1 against `cardBackground` / `surface`. */
  solid: string;
}
