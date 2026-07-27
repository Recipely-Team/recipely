export interface RecipeLikeState {
  likeCount: number;
  likedByMe: boolean;
  isLoading: boolean;
  /**
   * Epoch ms of whatever produced this state — the user's own toggle, or the
   * `fetchedAt` of the response it came from. `syncFromApi` compares against
   * it so a cached (older) recipe cannot rewind a like the user just made.
   */
  updatedAt: number;
}
