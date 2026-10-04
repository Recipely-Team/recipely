// Wire shape of a cover photo's credit: `license` is CC0, PD, CC-BY-x.y or CC-BY-SA-x.y.
// Keep in sync with recipely-backend `application/recipes/dtos/image-credit.dto.ts`.
export interface ImageCreditDto {
  author: string;
  license: string;
  url: string;
}
