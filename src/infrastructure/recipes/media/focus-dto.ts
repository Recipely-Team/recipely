// Wire shape of a photo's focal point: shares of the frame, 0..1 from the left and the top.
// Keep in sync with recipely-backend `application/recipes/dtos/focus.dto.ts`.
export interface FocusDto {
  x: number;
  y: number;
}
