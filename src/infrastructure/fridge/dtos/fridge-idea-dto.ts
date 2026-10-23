/** One idea of `POST /fridge/ideas` as it is on the wire (`difficulty`: `EASY` | `MEDIUM` | `HARD`). */
export interface FridgeIdeaDto {
  title: string;
  summary: string;
  totalMinutes: number;
  difficulty: string;
  /** Older servers omit it. */
  uses?: string[];
  /** Older servers omit it. */
  missing?: string[];
}
