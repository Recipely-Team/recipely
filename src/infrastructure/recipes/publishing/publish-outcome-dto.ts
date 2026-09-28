// Wire shape of `POST /recipes/:id/publish` and `/unpublish`.
export interface PublishOutcomeDto {
  isPublished: boolean;
  moderationStatus: string;
}
