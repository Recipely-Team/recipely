import type { SourcePlatformType } from '@domain/recipes/provenance/source-platform';

/** Where an import notification's recipe came from, as the row draws it. */
export interface ImportSource {
  platform: SourcePlatformType;
  /** The account, channel or site; absent when the importer did not report one. */
  handle?: string;
}
