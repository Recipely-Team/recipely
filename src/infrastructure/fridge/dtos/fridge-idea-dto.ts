/** One idea of `POST /fridge/ideas` as it is on the wire (`difficulty`: `EASY` | `MEDIUM` | `HARD`). */
export interface FridgeIdeaDto {
  title: string;
  summary: string;
  totalMinutes: number;
  difficulty: string;
  uses: string[];
  missing: string[];
}
