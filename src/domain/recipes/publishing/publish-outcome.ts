/** What a publish or unpublish request left the recipe as. */
export interface PublishOutcome {
  isPublished: boolean;
  moderationStatus: string;
}
