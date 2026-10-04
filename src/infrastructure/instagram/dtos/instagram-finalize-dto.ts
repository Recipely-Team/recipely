import type { InstagramConnectionDto } from '@infrastructure/instagram/dtos/instagram-connection-dto';

// `POST /me/instagram/finalize` answer.
export interface InstagramFinalizeDto {
  connection: InstagramConnectionDto;
  creatorTag: string;
}
