import type { MediaType } from '@domain/recipes/media/media-type';
import type { FocusDto } from '@infrastructure/recipes/media/focus-dto';

// Wire shape returned by the Recipely backend for a single recipe media item.
// Keep in sync with recipely-backend `application/recipes/dtos/recipe.dto.ts`.
export interface MediaDto {
  id: string;
  type: MediaType;
  url: string;
  position: number;
  /** Absent until the backend's focus sweep has looked at this photo. */
  focus?: FocusDto;
}
