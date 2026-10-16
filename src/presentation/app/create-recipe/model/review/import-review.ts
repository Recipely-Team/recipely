import type { SourcePlatformType } from '@domain/recipes/provenance/source-platform';

/** What the draft editor shows about an import: the note, the source, and which lines to check. */
export interface ImportReview {
  /** The post had no recipe; this one was written for the dish it shows. */
  readonly suggested: boolean;
  /** The caption and transcript, in the post's language; absent when none came back. */
  readonly sourceText?: string;
  readonly sourceUrl?: string;
  readonly sourcePlatform: SourcePlatformType | null;
  /** Lines (by text) the model guessed and the user has not edited. */
  readonly guessed: ReadonlySet<string>;
}
