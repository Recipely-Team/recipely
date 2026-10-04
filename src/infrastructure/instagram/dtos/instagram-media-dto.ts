// One item of `GET /me/instagram/media`.
export interface InstagramMediaDto {
  id: string;
  mediaType: string;
  thumbnailUrl: string | null;
  caption: string | null;
  permalink: string | null;
  timestamp: string | null;
}
