// Wire shape of `DELETE /recipes/:id/cover`.
export interface CoverRemovalDto {
  image: string;
  removedMediaIds: string[];
}
