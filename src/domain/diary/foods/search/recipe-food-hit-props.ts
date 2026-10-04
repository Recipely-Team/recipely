import type { Nutrients } from '@domain/diary/nutrition/nutrients';

export interface RecipeFoodHitProps {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string | null;
  /** Nutrients of ONE serving, as the search returns them. */
  readonly perServing: Nutrients;
  /** The viewer's own recipe that is not published (private, in review, rejected). */
  readonly isDraft: boolean;
}
